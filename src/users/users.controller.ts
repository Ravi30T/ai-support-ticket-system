import { Controller, Post, Body, UseGuards, Res, Logger, Get, Req, Query } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CreateCategoryDTO } from '../tickets/dto/category.dto';
import { CategoryService } from '../tickets/services/category.service';
import { TicketsService } from '../tickets/services/tickets.service';
import { GetTicketsQueryDTO } from '../tickets/dto/ticket.dto';

interface HttpExceptionLike {
  status?: number;
  statusCode?: number;
  message?: string;
  stack?: string;
}

type RequestWithUser = FastifyRequest & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Users & Categories')
@Controller('/user')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly categoryService: CategoryService,
    private readonly ticketsService: TicketsService,
  ) {}

  /**
   * API for creating a new ticket category (Admin only).
   */
  @Post('/category')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new ticket category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 409, description: 'Category already exists.' })
  async createCategory(
    @Res() res: FastifyReply,
    @Body() dto: CreateCategoryDTO,
  ) {
    try {
      const result = await this.categoryService.createCategory(dto);
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in createCategory endpoint', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res.status(status).send({
        success: false,
        status_code: status,
        message,
      });
    }
  }

  /**
   * API for retrieving all tickets created by the logged-in user.
   */
  @Get('/tickets')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all tickets created by the logged-in user' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMyTickets(
    @Req() req: RequestWithUser,
    @Res() res: FastifyReply,
    @Query() query: GetTicketsQueryDTO,
  ) {
    try {
      const userId = req.user.sub;
      const result = await this.ticketsService.getTicketsCreatedByUser(userId, query);
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in getMyTickets endpoint', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res.status(status).send({
        success: false,
        status_code: status,
        message,
      });
    }
  }

  /**
   * API for retrieving all tickets assigned to the logged-in agent (Admin only).
   */
  @Get('/tickets/assigned')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all tickets assigned to the logged-in agent (Admin only)' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  async getMyAssignedTickets(
    @Req() req: RequestWithUser,
    @Res() res: FastifyReply,
    @Query() query: GetTicketsQueryDTO,
  ) {
    try {
      const agentId = req.user.sub;
      const result = await this.ticketsService.getTicketsAssignedToAgent(agentId, query);
      return res.status(result.status_code).send(result);
    } catch (error: unknown) {
      const err = error as HttpExceptionLike;
      this.logger.error('Error in getMyAssignedTickets endpoint', err.stack);
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || 'Internal server error';
      return res.status(status).send({
        success: false,
        status_code: status,
        message,
      });
    }
  }
}

