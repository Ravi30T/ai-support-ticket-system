import {
  Controller,
  Req,
  Res,
  Post,
  Logger,
  Body,
  Put,
  Param,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateRoleDTO, UpdateRoleDTO } from './dto/role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@Controller('/roles')
export class RolesController {
  private logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) {}

  /**
   * API for creating a role.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Role name already exists or invalid data.',
  })
  @ApiResponse({ status: 500, description: 'Failed to create role.' })
  async createRole(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() role: CreateRoleDTO,
  ) {
    try {
      const result: { success: boolean; status_code: number; message: string } =
        await this.rolesService.createRole(role);
      if (!result.success) {
        return res.code(result.status_code).send(result);
      }
      return res.code(result.status_code).send(result);
    } catch (error) {
      this.logger.error('Error creating role', JSON.stringify(error, null, 2));
      res.code(500).send({ message: 'Failed to create role' });
    }
  }

  /**
   * API for updating a role.
   */
  @Put(':roleId')
  @ApiOperation({ summary: 'Update an existing role by ID' })
  @ApiParam({
    name: 'roleId',
    description: 'The ID of the role to update',
    example: '60c72b2f9b1d8e001c888888',
  })
  @ApiResponse({ status: 200, description: 'Role updated successfully.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({ status: 500, description: 'Failed to update role.' })
  async updateRole(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() role: UpdateRoleDTO,
    @Param('roleId') roleId: string,
  ) {
    try {
      const result: { success: boolean; status_code: number; message: string } =
        await this.rolesService.updateRole(roleId, role);
      if (!result.success) {
        return res.code(result.status_code).send(result);
      }
      return res.code(result.status_code).send(result);
    } catch (error) {
      this.logger.error('Error updating role', JSON.stringify(error, null, 2));
      res.code(500).send({ message: 'Failed to update role' });
    }
  }
}
