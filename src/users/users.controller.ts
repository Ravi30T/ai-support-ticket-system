import { Controller, Post, Body, UseGuards, Res, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CreateCategoryDTO } from '../tickets/dto/category.dto';
import { CategoryService } from '../tickets/services/category.service';

interface HttpExceptionLike {
  status?: number;
  statusCode?: number;
  message?: string;
  stack?: string;
}

@ApiTags('Users & Categories')
@Controller('/user')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly categoryService: CategoryService) { }

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
}
