import { Controller, Req, Res, Post, Logger, Body, Put, Param } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { CreateRoleDTO, UpdateRoleDTO } from "./dto/role.dto";
import { RolesService } from "./roles.service";


@Controller('/roles')
export class RolesController {
    private logger = new Logger(RolesController.name);

    constructor(private readonly rolesService: RolesService) {
    }

    @Post()
    async createRole(@Req() req: FastifyRequest, @Res() res: FastifyReply, @Body() role: CreateRoleDTO) {
        try {
            const result: { success: boolean, status_code: number, message: string } = await this.rolesService.createRole(role);
            if (!result.success) {
                return res.code(result.status_code).send(result);
            }
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error("Error creating role", JSON.stringify(error, null, 2));
            res.code(500).send({ message: 'Failed to create role' });
        }
    }

    @Put(':roleId')
    async updateRole(@Req() req: FastifyRequest, @Res() res: FastifyReply, @Body() role: UpdateRoleDTO, @Param('roleId') roleId: string) {
        try {
            const result: { success: boolean, status_code: number, message: string } = await this.rolesService.updateRole(roleId, role);
            if (!result.success) {
                return res.code(result.status_code).send(result);
            }
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error("Error updating role", JSON.stringify(error, null, 2));
            res.code(500).send({ message: 'Failed to update role' });
        }
    }
}