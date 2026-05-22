import { Controller, Post, Body, Req, Res, UseGuards, Logger, } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDTO, InviteAdminDTO, SetupAdminDTO, VerifyUserDTO, LoginDTO, } from './dto/auth.dto';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';

@ApiTags('Authentication')
@Controller('/auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) { }

    /**
     * API for user registration.
     */
    @Post('/user/register')
    @ApiOperation({ summary: 'Register a new regular user' })
    @ApiResponse({
        status: 201,
        description: 'User registered successfully, verification email sent.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid input data or email already exists.',
    })
    @ApiResponse({ status: 500, description: 'Internal server error.' })
    async userRegister(@Res() res: FastifyReply, @Body() dto: RegisterUserDTO) {
        try {
            const result = await this.authService.register(dto);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error(
                'Error in register endpoint',
                error instanceof Error ? error.stack : String(error),
            );
            return res.code(500).send({
                success: false,
                status_code: 500,
                message: 'Internal server error',
            });
        }
    }

    /**
     * API for admin registration.
     */
    @Post('/admin/register')
    @ApiOperation({ summary: 'Register a new admin user' })
    @ApiResponse({
        status: 201,
        description: 'Admin registered successfully, verification email sent.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid input data or email already exists.',
    })
    @ApiResponse({ status: 500, description: 'Internal server error.' })
    async adminRegister(@Res() res: FastifyReply, @Body() dto: RegisterUserDTO) {
        try {
            const result = await this.authService.register(dto);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error(
                'Error in register endpoint',
                error instanceof Error ? error.stack : String(error),
            );
            return res.code(500).send({
                success: false,
                status_code: 500,
                message: 'Internal server error',
            });
        }
    }

    /**
     * API for user verification.
     */
    @Post('/verify')
    @ApiOperation({
        summary: 'Verify user/admin registration using token and OTP',
    })
    @ApiResponse({
        status: 200,
        description: 'User account verified successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid token or incorrect/expired OTP.',
    })
    @ApiResponse({ status: 500, description: 'Internal server error.' })
    async verify(@Res() res: FastifyReply, @Body() dto: VerifyUserDTO) {
        try {
            const result = await this.authService.verifyUser(dto);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error(
                'Error in verify endpoint',
                error instanceof Error ? error.stack : String(error),
            );
            return res.code(500).send({
                success: false,
                status_code: 500,
                message: 'Internal server error',
            });
        }
    }

    /**
     * API for user login.
     */
    @Post('/login')
    @ApiOperation({
        summary: 'Log in user/admin and return a JWT authentication token',
    })
    @ApiResponse({
        status: 200,
        description: 'Logged in successfully, token returned.',
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid credentials or account not verified.',
    })
    @ApiResponse({ status: 500, description: 'Internal server error.' })
    async login(@Res() res: FastifyReply, @Body() dto: LoginDTO) {
        try {
            const result = await this.authService.login(dto);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error(
                'Error in login endpoint',
                error instanceof Error ? error.stack : String(error),
            );
            return res.code(500).send({
                success: false,
                status_code: 500,
                message: 'Internal server error',
            });
        }
    }

    /**
     * API for inviting an admin.
     */
    @Post('/invite-admin')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Invite a new admin (Requires Admin role & JWT Bearer token)',
    })
    @ApiResponse({
        status: 201,
        description: 'Admin invited successfully and setup email sent.',
    })
    @ApiResponse({
        status: 401,
        description: 'Missing or invalid authentication token.',
    })
    @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
    @ApiResponse({ status: 500, description: 'Internal server error.' })
    async inviteAdmin(
        @Req() req: FastifyRequest & { user: { sub: string } },
        @Res() res: FastifyReply,
        @Body() dto: InviteAdminDTO,
    ) {
        try {
            const creatorId = req.user.sub;
            const result = await this.authService.inviteAdmin(dto, creatorId);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error(
                'Error in invite-admin endpoint',
                error instanceof Error ? error.stack : String(error),
            );
            return res.code(500).send({
                success: false,
                status_code: 500,
                message: 'Internal server error',
            });
        }
    }

    /**
     * API for setup admin.
     */
    @Post('/setup-admin')
    @ApiOperation({ summary: 'Complete setup for an invited admin account' })
    @ApiResponse({
        status: 200,
        description: 'Admin password configured successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid token/OTP or user already active.',
    })
    @ApiResponse({ status: 500, description: 'Internal server error.' })
    async setupAdmin(@Res() res: FastifyReply, @Body() dto: SetupAdminDTO) {
        try {
            const result = await this.authService.setupAdmin(dto);
            return res.code(result.status_code).send(result);
        } catch (error) {
            this.logger.error(
                'Error in setup-admin endpoint',
                error instanceof Error ? error.stack : String(error),
            );
            return res.code(500).send({
                success: false,
                status_code: 500,
                message: 'Internal server error',
            });
        }
    }
}
