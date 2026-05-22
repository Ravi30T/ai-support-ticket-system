import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tickets, TicketsDocument } from '../schemas/ticket.schema';
import { Comments, CommentsDocument } from '../schemas/comment.schema';
import {
  CreateTicketDTO,
  UpdateTicketStatusDTO,
  AssignTicketDTO,
  AddCommentDTO,
  GetTicketsQueryDTO,
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
    @InjectModel(Tickets.name)
    private readonly ticketsModel: Model<TicketsDocument>,
    @InjectModel(Comments.name)
    private readonly commentsModel: Model<CommentsDocument>,
    private readonly categoryService: CategoryService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

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

      const ticket = await this.ticketsModel.create({
        title: dto.title.trim(),
        description: dto.description.trim(),
        category: new Types.ObjectId(dto.category),
        created_by: new Types.ObjectId(userId),
        status: 'open',
      });

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

    ticket.status = dto.status;
    const updatedTicket = await ticket.save();

    return {
      success: true,
      status_code: 200,
      message: `Ticket status updated to '${dto.status}' successfully`,
      data: updatedTicket,
    };
  }

  async assignTicket(
    ticketId: string,
    dto: AssignTicketDTO,
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
}
