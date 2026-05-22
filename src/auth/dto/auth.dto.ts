import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for self-registration — regular users only.
 * Role is auto-assigned server-side (always 'user').
 */
export class RegisterUserDTO {
  @ApiProperty({
    description: 'The full name of the user',
    example: 'Ravi Teja',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'raviteja@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password for the user account (minimum 8 characters)',
    example: 'Ravi@123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

/**
 * DTO for inviting a new admin.
 * No password — the invited admin sets their own password via setup-admin.
 * Only an existing authenticated admin can call this.
 */
export class InviteAdminDTO {
  @ApiProperty({
    description: 'The full name of the invited admin',
    example: 'Admin Jane',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The email address of the invited admin',
    example: 'jane.admin@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

/**
 * DTO for completing admin account setup.
 * Called by the invited admin using the token & otp sent in the setup password email.
 */
export class SetupAdminDTO {
  @ApiProperty({
    description: 'The verification token received in the email',
    example: 'abc123xyztoken',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'The OTP code received in the email',
    example: 123456,
  })
  @IsNumber()
  @IsNotEmpty()
  otp: number;

  @ApiProperty({
    description:
      'The new password for the admin account (minimum 8 characters)',
    example: 'AdminSecurePass123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

/**
 * DTO for verifying user email registration.
 */
export class VerifyUserDTO {
  @ApiProperty({
    description: 'The verification token received in the email',
    example: 'abc123xyztoken',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'The OTP code received in the email',
    example: 123456,
  })
  @IsNumber()
  @IsNotEmpty()
  otp: number;
}

/**
 * DTO for user login.
 */
export class LoginDTO {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'raviteja@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password for the user account',
    example: 'Ravi@123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
