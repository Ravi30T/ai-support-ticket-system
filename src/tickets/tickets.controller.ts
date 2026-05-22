import { Controller, Post, Put, Get, Body, Param, Query, UseGuards, Req, Res, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { TicketsService } from './services/tickets.service';
import { CreateTicketDTO, UpdateTicketStatusDTO, AssignTicketDTO, AddCommentDTO, GetTicketsQueryDTO, } from './dto/ticket.dto';

interface RequestWithUser {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

interface HttpExceptionLike {
  status?: number;
  statusCode?: number;
  message?: string;
  stack?: string;
}

@ApiTags('Tickets')
@Controller('/tickets')
export class TicketsController {
  private readonly logger = new Logger(TicketsController.name);

  constructor(private readonly ticketsService: TicketsService) { }

  @Post('/')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('user')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new ticket (Users only)' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User role required.' })
  async createTicket(@Req() req: RequestWithUser, @Res() res: FastifyReply, @Body() dto: CreateTicketDTO,) {
    try {
      const userId = req.user.sub;
      const result = await this.ticketsService.createTicket(dto, userId);
      return res.code(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in createTicket', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res.status(status).send({ success: false, status_code: status, message });
    }
  }

  @Put('/:id/status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update ticket status (Owner or Admin)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async updateTicketStatus(@Param('id') id: string, @Req() req: RequestWithUser, @Res() res: FastifyReply, @Body() dto: UpdateTicketStatusDTO,) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.ticketsService.updateTicketStatus(id, dto, userId, userRole);
      return res.code(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in updateTicketStatus', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res.status(status).send({ success: false, status_code: status, message });
    }
  }

  @Put('/:id/assign')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign a ticket to an admin agent (Admin only)' })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or agent not admin.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Ticket or agent not found.' })
  async assignTicket(@Param('id') id: string, @Res() res: FastifyReply, @Body() dto: AssignTicketDTO,) {
    try {
      const result = await this.ticketsService.assignTicket(id, dto);
      return res.code(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in assignTicket', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res.status(status).send({ success: false, status_code: status, message });
    }
  }

  @Post('/:id/comments')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Add a comment or reply to a ticket (Owner or Admin)',
  })
  @ApiResponse({ status: 201, description: 'Comment added successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async addComment(@Param('id') id: string, @Req() req: RequestWithUser, @Res() res: FastifyReply, @Body() dto: AddCommentDTO,) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.ticketsService.addComment(id, dto, userId, userRole);
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in addComment', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res.status(status).send({ success: false, status_code: status, message });
    }
  }

  @Get('/')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'List tickets with filters and pagination (Admin sees all, User sees own)',
  })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async listTickets(@Req() req: RequestWithUser, @Res() res: FastifyReply, @Query() query: GetTicketsQueryDTO,) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.ticketsService.listTickets(query, userId, userRole);
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in listTickets', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res.status(status).send({ success: false, status_code: status, message });
    }
  }
}
