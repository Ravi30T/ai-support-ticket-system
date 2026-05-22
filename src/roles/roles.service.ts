import { Injectable, Logger } from '@nestjs/common';
import { Roles, RolesDocument } from './schemas/roles.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { CreateRoleDTO, UpdateRoleDTO } from './dto/role.dto';

@Injectable()
export class RolesService {
  private logger = new Logger(RolesService.name);

  constructor(
    @InjectModel(Roles.name) private readonly rolesModel: Model<RolesDocument>,
  ) {}

  async createRole(
    role: CreateRoleDTO,
  ): Promise<{ success: boolean; status_code: number; message: string }> {
    try {
      const existRole = await this.rolesModel.findOne({ name: role.name });
      if (existRole) {
        return {
          success: false,
          status_code: 409,
          message: 'Role already exists',
        };
      }

      await this.rolesModel.create(role);
      return {
        success: true,
        status_code: 201,
        message: 'Role created successfully',
      };
    } catch (error) {
      this.logger.error('Error creating role', JSON.stringify(error, null, 2));
      return {
        success: false,
        status_code: 500,
        message: 'Failed to create role',
      };
    }
  }

  async updateRole(
    roleId: string,
    role: UpdateRoleDTO,
  ): Promise<{ success: boolean; status_code: number; message: string }> {
    try {
      const existRole = await this.rolesModel.findById(roleId);
      if (!existRole) {
        return { success: false, status_code: 404, message: 'Role not found' };
      }
      await this.rolesModel.updateOne({ _id: roleId }, role);
      return {
        success: true,
        status_code: 200,
        message: 'Role updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating role', JSON.stringify(error, null, 2));
      return {
        success: false,
        status_code: 500,
        message: 'Failed to update role',
      };
    }
  }

  async findByName(name: string): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    role?: RolesDocument;
  }> {
    try {
      const role = await this.rolesModel
        .findOne({ name: name.toLowerCase().trim() })
        .exec();
      if (!role) {
        return { success: false, status_code: 404, message: 'Role not found' };
      }
      return {
        success: true,
        status_code: 200,
        message: 'Role found successfully',
        role,
      };
    } catch (error) {
      this.logger.error(
        'Error finding role by name',
        JSON.stringify(error, null, 2),
      );
      return {
        success: false,
        status_code: 500,
        message: 'Failed to find role',
      };
    }
  }

  async findOrCreateRole(
    name: string,
    description?: string,
  ): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    role?: RolesDocument;
  }> {
    try {
      const normalizedName = name.toLowerCase().trim();
      const role = await this.rolesModel
        .findOne({ name: normalizedName })
        .exec();
      if (!role) {
        const newRole = await this.rolesModel.create({
          name: normalizedName,
          description: description || `${name} role`,
          is_active: true,
        });

        if (newRole) {
          this.logger.log(
            `New role ${normalizedName} created successfully`,
            JSON.stringify(newRole, null, 2),
          );
          return {
            success: true,
            status_code: 201,
            message: 'Role created successfully',
            role: newRole,
          };
        }

        return {
          success: false,
          status_code: 500,
          message: 'Failed to create role',
        };
      }
      this.logger.log(
        `Role ${normalizedName} already exists`,
        JSON.stringify(role, null, 2),
      );
      return {
        success: true,
        status_code: 200,
        message: 'Role already exists',
        role: role,
      };
    } catch (error) {
      this.logger.error(
        'Error finding or creating role',
        JSON.stringify(error, null, 2),
      );
      return {
        success: false,
        status_code: 500,
        message: 'Failed to find or create role',
      };
    }
  }
}
