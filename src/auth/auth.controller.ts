import { Controller, Post, Body, Req, Res, UseGuards, Logger } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { RegisterUserDTO, InviteAdminDTO, SetupAdminDTO, VerifyUserDTO, LoginDTO } from "./dto/auth.dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { RolesGuard } from "../shared/guards/roles.guard";
import { Roles } from "../shared/decorators/roles.decorator";

@Controller("/auth")
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) { }

    /**
     * API for user registration.
    */
    @Post("/user/register")
    async userRegister(@Res() res: FastifyReply, @Body() dto: RegisterUserDTO) {
        try {
            const result = await this.authService.register(dto);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error("Error in register endpoint", error.stack);
            return res.code(500).send({ success: false, status_code: 500, message: "Internal server error" });
        }
    }

    /**
     * API for admin registration.
    */
    @Post("/admin/register")
    async adminRegister(@Res() res: FastifyReply, @Body() dto: RegisterUserDTO) {
        try {
            const result = await this.authService.register(dto);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error("Error in register endpoint", error.stack);
            return res.code(500).send({ success: false, status_code: 500, message: "Internal server error" });
        }
    }

    /**
     * API for user verification.
    */
    @Post("/verify")
    async verify(@Res() res: FastifyReply, @Body() dto: VerifyUserDTO) {
        try {
            const result = await this.authService.verifyUser(dto);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error("Error in verify endpoint", error.stack);
            return res.code(500).send({ success: false, status_code: 500, message: "Internal server error" });
        }
    }

    /**
     * API for user login.
    */
    @Post("/login")
    async login(@Res() res: FastifyReply, @Body() dto: LoginDTO) {
        try {
            const result = await this.authService.login(dto);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error("Error in login endpoint", error.stack);
            return res.code(500).send({ success: false, status_code: 500, message: "Internal server error" });
        }
    }

    /**
     * API for inviting an admin.
    */
    @Post("/invite-admin")
    @UseGuards(AuthGuard, RolesGuard)
    @Roles("admin")
    async inviteAdmin(@Req() req: FastifyRequest & { user: any }, @Res() res: FastifyReply, @Body() dto: InviteAdminDTO) {
        try {
            const creatorId = req.user.sub;
            const result = await this.authService.inviteAdmin(dto, creatorId);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error("Error in invite-admin endpoint", error.stack);
            return res.code(500).send({ success: false, status_code: 500, message: "Internal server error" });
        }
    }

    /**
     * API for setup admin.
    */
    @Post("/setup-admin")
    async setupAdmin(@Res() res: FastifyReply, @Body() dto: SetupAdminDTO) {
        try {
            const result = await this.authService.setupAdmin(dto);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error("Error in setup-admin endpoint", error.stack);
            return res.code(500).send({ success: false, status_code: 500, message: "Internal server error" });
        }
    }
}
