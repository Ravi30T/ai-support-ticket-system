import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import {
  UserToken,
  UserTokenDocument,
  UserTokenType,
} from '../users/schemas/user-token.schema';
import {
  RegisterUserDTO,
  InviteAdminDTO,
  SetupAdminDTO,
  VerifyUserDTO,
  LoginDTO,
} from './dto/auth.dto';
import {
  hashPassword,
  comparePassword,
  hashToken,
  hashOtp,
} from '../common/utils/helpers';
import {
  sendEmail,
  getUserOtpEmailTemplate,
  getAdminInviteEmailTemplate,
} from '../common/mail.helper';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    @InjectModel(UserToken.name)
    private readonly userTokenModel: Model<UserTokenDocument>,
  ) { }

  /**
   * Self-registration for standard users.
   */
  async register(
    dto: RegisterUserDTO,
    roleName: string = 'user',
  ): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    data?: { token: string };
  }> {
    try {
      const email = dto.email.toLowerCase().trim();
      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          status_code: 409,
          message: 'User with this email already exists',
        };
      }

      const userRole = await this.rolesService.findByName(roleName);
      const hashedPassword = hashPassword(dto.password);

      const newUser = await this.usersService.create({
        name: dto.name,
        email,
        role: userRole.role?._id,
        is_active: false, // Inactive until verified
        password_obj: [
          {
            password: hashedPassword,
            changed_at: new Date(),
            is_active: true,
          },
        ],
      });

      // Generate user verification token & 6-digit OTP
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = hashToken(rawToken);
      const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
      const hashedOtp = hashOtp(otp);

      await this.userTokenModel.create({
        user_id: newUser._id,
        token: hashedToken,
        otp: hashedOtp,
        type: UserTokenType.USER_EMAIL_VERIFY,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // Send verification email
      try {
        await sendEmail(
          email,
          'Verify Your Account - Smart Support Ticketing System',
          getUserOtpEmailTemplate(newUser.name, otp),
        );
      } catch (mailError: any) {
        this.logger.error(
          `Failed to send verification email to ${email}`,
          mailError instanceof Error ? mailError.stack : String(mailError),
        );
      }

      return {
        success: true,
        status_code: 201,
        message:
          'User registered successfully. Please verify your email to activate your account.',
        data: { token: rawToken },
      };
    } catch (error) {
      this.logger.error(
        'Error in user registration',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        success: false,
        status_code: 500,
        message: 'Failed to register user',
      };
    }
  }

  /**
   * Verify a registered user's email token.
   */
  async verifyUser(
    dto: VerifyUserDTO,
  ): Promise<{ success: boolean; status_code: number; message: string }> {
    try {
      const hashedToken = hashToken(dto.token);
      const hashedOtp = hashOtp(dto.otp);
      const tokenDoc = await this.userTokenModel.findOne({
        token: hashedToken,
        otp: hashedOtp,
        type: UserTokenType.USER_EMAIL_VERIFY,
        used_at: null,
        expires_at: { $gt: new Date() },
      });

      if (!tokenDoc) {
        return {
          success: false,
          status_code: 400,
          message: 'Invalid or expired verification token',
        };
      }

      const user = await this.usersService.findById(
        tokenDoc.user_id.toString(),
      );
      if (!user) {
        return { success: false, status_code: 404, message: 'User not found' };
      }

      // Activate user and save
      await this.usersService.update(user._id.toString(), {
        is_active: true,
      });

      // Mark token as used
      tokenDoc.used_at = new Date();
      await tokenDoc.save();

      return {
        success: true,
        status_code: 200,
        message:
          'Email verified successfully. Your account is now active and you can log in.',
      };
    } catch (error) {
      this.logger.error(
        'Error in verifying user email',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        success: false,
        status_code: 500,
        message: 'Failed to verify email',
      };
    }
  }

  /**
   * User/Admin Login.
   */
  async login(dto: LoginDTO): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    data?: { access_token: string; user: any };
  }> {
    try {
      const email = dto.email.toLowerCase().trim();
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        return {
          success: false,
          status_code: 401,
          message: 'Invalid email or password',
        };
      }

      const activePassObj = user.password_obj.find((p) => p.is_active);
      if (
        !activePassObj ||
        !comparePassword(dto.password, activePassObj.password)
      ) {
        return {
          success: false,
          status_code: 401,
          message: 'Invalid email or password',
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          status_code: 403,
          message: 'Your account is not active. Please complete verification.',
        };
      }

      // Populate role name for JWT payload
      const roleName = (user.role as any).name;

      const payload = {
        sub: user._id,
        email: user.email,
        role: roleName,
      };

      const access_token = await this.jwtService.signAsync(payload);

      return {
        success: true,
        status_code: 200,
        message: 'Login successful',
        data: {
          access_token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: roleName,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        'Error in user login',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        success: false,
        status_code: 500,
        message: 'Failed to authenticate',
      };
    }
  }

  /**
   * Invite a new admin. Restricted to existing authenticated admin.
   */
  async inviteAdmin(
    dto: InviteAdminDTO,
    creatorId: string,
  ): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    data?: { token: string };
  }> {
    try {
      const email = dto.email.toLowerCase().trim();
      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          status_code: 409,
          message: 'User with this email already exists',
        };
      }

      const adminRole = await this.rolesService.findByName('admin');
      const newAdmin = await this.usersService.create({
        name: dto.name,
        email,
        role: adminRole.role?._id,
        is_active: false, // Inactive until setup completed
        created_by: creatorId,
        password_obj: [], // No password initially
      });

      // Generate setup token & 6-digit OTP
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = hashToken(rawToken);
      const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

      console.log('OTP: ', otp);

      const hashedOtp = hashOtp(otp);

      await this.userTokenModel.create({
        user_id: newAdmin._id,
        token: hashedToken,
        otp: hashedOtp,
        type: UserTokenType.ADMIN_SETUP_PASSWORD,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // Send invitation email
      try {
        await sendEmail(
          email,
          'Admin Invitation - Smart Support Ticketing System',
          getAdminInviteEmailTemplate(newAdmin.name, otp, rawToken),
        );
      } catch (mailError: any) {
        this.logger.error(
          `Failed to send admin invitation email to ${email}`,
          mailError instanceof Error ? mailError.stack : String(mailError),
        );
      }

      return {
        success: true,
        status_code: 201,
        message: 'Admin user invited successfully. Setup password required.',
        data: {
          token: rawToken,
        },
      };
    } catch (error) {
      this.logger.error(
        'Error in inviting admin',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        success: false,
        status_code: 500,
        message: 'Failed to invite admin',
      };
    }
  }

  /**
   * Complete admin setup.
   */
  async setupAdmin(
    dto: SetupAdminDTO,
  ): Promise<{ success: boolean; status_code: number; message: string }> {
    try {
      const hashedToken = hashToken(dto.token);
      const hashedOtp = hashOtp(dto.otp);
      const tokenDoc = await this.userTokenModel.findOne({
        token: hashedToken,
        otp: hashedOtp,
        type: UserTokenType.ADMIN_SETUP_PASSWORD,
        used_at: null,
        expires_at: { $gt: new Date() },
      });

      if (!tokenDoc) {
        return {
          success: false,
          status_code: 400,
          message: 'Invalid or expired setup token/OTP',
        };
      }

      const user = await this.usersService.findById(
        tokenDoc.user_id.toString(),
      );
      if (!user) {
        return { success: false, status_code: 404, message: 'User not found' };
      }

      const hashedPassword = hashPassword(dto.password);

      // Update user password and set to active
      await this.usersService.update(user._id.toString(), {
        is_active: true,
        password_obj: [
          {
            password: hashedPassword,
            changed_at: new Date(),
            is_active: true,
          },
        ],
      });

      // Mark token as used
      tokenDoc.used_at = new Date();
      await tokenDoc.save();

      return {
        success: true,
        status_code: 200,
        message:
          'Admin account setup completed successfully. You can now log in.',
      };
    } catch (error) {
      this.logger.error(
        'Error in admin password setup',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        success: false,
        status_code: 500,
        message: 'Failed to complete admin setup',
      };
    }
  }
}
