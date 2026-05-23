import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { TicketsService } from './services/tickets.service';
import { AiService } from './services/ai.service';
import {
  CreateTicketDTO,
  UpdateTicketStatusDTO,
  AssignTicketDTO,
  AddCommentDTO,
  GetTicketsQueryDTO,
  GetActivitiesQueryDTO,
  GetCommentsQueryDTO,
} from './dto/ticket.dto';

type RequestWithUser = FastifyRequest & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

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

  constructor(
    private readonly ticketsService: TicketsService,
    private readonly aiService: AiService,
  ) { }

  @Post('/')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('user')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new ticket (Users only)' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User role required.' })
  async createTicket(
    @Req() req: RequestWithUser,
    @Res() res: FastifyReply,
    @Body() dto: CreateTicketDTO,
  ) {
    try {
      const userId = req.user.sub;
      const result = await this.ticketsService.createTicket(dto, userId);
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in createTicket', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res
        .status(status)
        .send({ success: false, status_code: status, message });
    }
  }

  @Put('/:id/status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update ticket status (Owner or Admin)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: FastifyReply,
    @Body() dto: UpdateTicketStatusDTO,
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.ticketsService.updateTicketStatus(
        id,
        dto,
        userId,
        userRole,
      );
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in updateTicketStatus', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res
        .status(status)
        .send({ success: false, status_code: status, message });
    }
  }

  @Put('/:id/assign')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign a ticket to an admin agent (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or agent not admin.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Ticket or agent not found.' })
  async assignTicket(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: FastifyReply,
    @Body() dto: AssignTicketDTO,
  ) {
    try {
      const userId = req.user.sub;
      const result = await this.ticketsService.assignTicket(id, dto, userId);
      return res.code(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in assignTicket', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res
        .status(status)
        .send({ success: false, status_code: status, message });
    }
  }

  @Post('/:id/comments')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Add a comment or reply to a ticket (Owner or Admin)',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ticket ID' })
  @ApiResponse({ status: 201, description: 'Comment added successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async addComment(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: FastifyReply,
    @Body() dto: AddCommentDTO,
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.ticketsService.addComment(
        id,
        dto,
        userId,
        userRole,
      );
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in addComment', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res
        .status(status)
        .send({ success: false, status_code: status, message });
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
  async listTickets(
    @Req() req: RequestWithUser,
    @Res() res: FastifyReply,
    @Query() query: GetTicketsQueryDTO,
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.ticketsService.listTickets(
        query,
        userId,
        userRole,
      );
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in listTickets', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res.status(status).send({ success: false, status_code: status, message });
    }
  }

  @Get('/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a specific ticket by ID (Owner or Admin)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async getTicketById(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.ticketsService.getTicketById(
        id,
        userId,
        userRole,
      );
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in getTicketById', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res
        .status(status)
        .send({ success: false, status_code: status, message });
    }
  }

  @Get('/:id/activities')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get ticket activities history (Owner or Admin)',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ticket ID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket activities retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async getTicketActivities(@Param('id') id: string, @Req() req: RequestWithUser, @Res() res: FastifyReply, @Query() query: GetActivitiesQueryDTO,) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.ticketsService.getTicketActivities(
        id,
        query,
        userId,
        userRole,
      );
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in getTicketActivities', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res
        .status(status)
        .send({ success: false, status_code: status, message });
    }
  }

  @Get('/:id/comments')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get ticket comments with pagination (Owner or Admin)',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ticket ID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket comments retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async getTicketComments(@Param('id') id: string, @Req() req: RequestWithUser, @Res() res: FastifyReply, @Query() query: GetCommentsQueryDTO) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.ticketsService.getTicketComments(
        id,
        query,
        userId,
        userRole,
      );
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in getTicketComments', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res
        .status(status)
        .send({ success: false, status_code: status, message });
    }
  }

  @Get('/:id/summary')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate ticket summary using AI' })
  @ApiParam({ name: 'id', type: 'string', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Summary generated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async generateTicketSummary(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.aiService.generateTicketSummary(id, userId, userRole);
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in generateTicketSummary', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res
        .status(status)
        .send({ success: false, status_code: status, message });
    }
  }

  @Post('/:id/auto-categorize')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Auto-categorize ticket using AI based on content' })
  @ApiParam({ name: 'id', type: 'string', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket auto-categorized successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request. No categories available or matching failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async autoCategorizeTicket(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      const result = await this.aiService.autoCategorizeTicket(id, userId, userRole);
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in autoCategorizeTicket', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res
        .status(status)
        .send({ success: false, status_code: status, message });
    }
  }
}
