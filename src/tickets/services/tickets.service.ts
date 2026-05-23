import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tickets, TicketsDocument } from '../schemas/ticket.schema';
import { Comments, CommentsDocument } from '../schemas/comment.schema';
import { Counters, CountersDocument } from '../schemas/counter.schema';
import { Activities, ActivitiesDocument } from '../schemas/activity.schema';
import {
  CreateTicketDTO,
  UpdateTicketStatusDTO,
  AssignTicketDTO,
  AddCommentDTO,
  GetTicketsQueryDTO,
  GetActivitiesQueryDTO,
} from '../dto/ticket.dto';
import { UsersService } from '../../users/users.service';
import { CategoryService } from './category.service';

interface UserRolePopulated {
  name?: string;
}

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectModel(Tickets.name) private readonly ticketsModel: Model<TicketsDocument>,
    @InjectModel(Comments.name) private readonly commentsModel: Model<CommentsDocument>,
    @InjectModel(Counters.name) private readonly countersModel: Model<CountersDocument>,
    @InjectModel(Activities.name) private readonly activitiesModel: Model<ActivitiesDocument>,
    private readonly categoryService: CategoryService,
    @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
  ) { }

  private async _logActivity(ticketId: string, performedBy: string, action: string, details: string | null = null): Promise<void> {
    try {
      await this.activitiesModel.create({
        ticket_id: new Types.ObjectId(ticketId),
        performed_by: new Types.ObjectId(performedBy),
        action,
        details,
      });
    } catch (error) {
      this.logger.error('Error logging activity', error);
    }
  }

  async createTicket(
    dto: CreateTicketDTO,
    userId: string,
  ): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    data?: any;
  }> {
    try {
      if (dto.category) {
        const category = await this.categoryService.findById(dto.category);
        if (!category) {
          return {
            success: false,
            status_code: 404,
            message: 'Category not found',
          };
        }
      }

      // Generate sequential ticket number (e.g. SST-2026-001)
      const year = new Date().getFullYear();
      const counterKey = `SST-${year}`;

      const counter = await this.countersModel.findOneAndUpdate(
        { _id: counterKey },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      const seqStr = String(counter.seq).padStart(3, '0');
      const ticketNumber = `${counterKey}-${seqStr}`;

      const ticket = await this.ticketsModel.create({
        title: dto.title.trim(),
        description: dto.description.trim(),
        category: dto.category ? new Types.ObjectId(dto.category) : null,
        created_by: new Types.ObjectId(userId),
        status: 'open',
        ticket_number: ticketNumber,
      });

      await this._logActivity(ticket._id.toString(), userId, 'created');

      return {
        success: true,
        status_code: 201,
        message: 'Ticket created successfully',
        data: ticket,
      };
    } catch (error) {
      this.logger.error('Error in create ticket', error);
      return {
        success: false,
        status_code: 500,
        message: 'Failed to create ticket',
      };
    }
  }

  async updateTicketStatus(
    ticketId: string,
    dto: UpdateTicketStatusDTO,
    userId: string,
    userRole: string,
  ): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    data?: any;
  }> {
    const ticket = await this.ticketsModel.findById(ticketId).exec();
    if (!ticket) {
      return {
        success: false,
        status_code: 404,
        message: 'Ticket not found',
      };
    }

    if (userRole.toLowerCase() !== 'admin') {
      if (ticket.created_by.toString() !== userId) {
        return {
          success: false,
          status_code: 403,
          message: 'You are not authorized to update this ticket status',
        };
      }
    }

    const oldStatus = ticket.status;
    ticket.status = dto.status;
    const updatedTicket = await ticket.save();

    await this._logActivity(
      ticket._id.toString(),
      userId,
      'status_changed',
      `from ${oldStatus} to ${dto.status}`,
    );

    return {
      success: true,
      status_code: 200,
      message: `Ticket status updated to '${dto.status}' successfully`,
      data: updatedTicket,
    };
  }

  async assignTicket(ticketId: string, dto: AssignTicketDTO, userId: string): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    data?: any;
  }> {
    const ticket = await this.ticketsModel.findById(ticketId).exec();
    if (!ticket) {
      return {
        success: false,
        status_code: 404,
        message: 'Ticket not found',
      };
    }

    const agent = await this.usersService.findById(dto.agentId);
    if (!agent) {
      return {
        success: false,
        status_code: 404,
        message: 'Agent not found',
      };
    }

    const roleObj = agent.role as unknown as UserRolePopulated;
    const roleName = roleObj?.name;
    if (!roleName || roleName.toLowerCase() !== 'admin') {
      return {
        success: false,
        status_code: 400,
        message: 'Tickets can only be assigned to admin agents',
      };
    }

    ticket.assigned_to = new Types.ObjectId(dto.agentId);
    const updatedTicket = await ticket.save();

    await this._logActivity(
      ticket._id.toString(),
      userId,
      'assigned',
      `assigned to ${agent.name}`,
    );

    return {
      success: true,
      status_code: 200,
      message: `Ticket assigned to agent ${agent.name} successfully`,
      data: updatedTicket,
    };
  }

  async addComment(
    ticketId: string,
    dto: AddCommentDTO,
    userId: string,
    userRole: string,
  ): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    data?: any;
  }> {
    const ticket = await this.ticketsModel.findById(ticketId).exec();
    if (!ticket) {
      return {
        success: false,
        status_code: 404,
        message: 'Ticket not found',
      };
    }

    const normalizedRole = userRole.toLowerCase();

    if (normalizedRole !== 'admin') {
      if (ticket.created_by.toString() !== userId) {
        return {
          success: false,
          status_code: 403,
          message: 'You are not authorized to comment on this ticket',
        };
      }
    }

    const comment = await this.commentsModel.create({
      ticket_id: new Types.ObjectId(ticketId),
      sender: new Types.ObjectId(userId),
      sender_role: normalizedRole === 'admin' ? 'admin' : 'user',
      text: dto.text.trim(),
    });

    await this._logActivity(ticket._id.toString(), userId, 'comment_added');

    return {
      success: true,
      status_code: 201,
      message: 'Comment added successfully',
      data: comment,
    };
  }

  async listTickets(
    query: GetTicketsQueryDTO,
    userId: string,
    userRole: string,
  ): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    data: {
      tickets: any[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const filter: {
      created_by?: Types.ObjectId;
      status?: string;
      category?: Types.ObjectId;
      $or?: Array<{
        title?: { $regex: string; $options: string };
        description?: { $regex: string; $options: string };
      }>;
    } = {};

    if (userRole.toLowerCase() !== 'admin') {
      filter.created_by = new Types.ObjectId(userId);
    }

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    if (query.category && query.category !== 'all') {
      filter.category = new Types.ObjectId(query.category);
    }
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const total = await this.ticketsModel.countDocuments(filter).exec();
    const tickets = await this.ticketsModel
      .find(filter)
      .populate('category', 'name description')
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const pages = Math.ceil(total / limit);

    return {
      success: true,
      status_code: 200,
      message: 'Tickets retrieved successfully',
      data: {
        tickets,
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async getTicketActivities(ticketId: string, query: GetActivitiesQueryDTO, userId: string, userRole: string): Promise<{ success: boolean; status_code: number; message: string; data?: any }> {
    const ticket = await this.ticketsModel.findById(ticketId).exec();
    if (!ticket) {
      return { success: false, status_code: 404, message: 'Ticket not found' };
    }

    if (userRole.toLowerCase() !== 'admin') {
      if (ticket.created_by.toString() !== userId) {
        return {
          success: false,
          status_code: 403,
          message: 'You are not authorized to view activities for this ticket',
        };
      }
    }

    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    const filter = { ticket_id: new Types.ObjectId(ticketId) };

    const total = await this.activitiesModel.countDocuments(filter).exec();
    const activities = await this.activitiesModel
      .find(filter)
      .populate('performed_by', 'name email role.name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const pages = Math.ceil(total / limit);

    return {
      success: true,
      status_code: 200,
      message: 'Ticket activities retrieved successfully',
      data: {
        activities,
        total,
        page,
        limit,
        pages,
      },
    };
  }
}
