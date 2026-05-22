import { IsEmail, IsString, IsNotEmpty, MinLength, IsNumber } from "class-validator";

/**
 * DTO for self-registration — regular users only.
 * Role is auto-assigned server-side (always 'user').
 */
export class RegisterUserDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

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
    @IsString()
    @IsNotEmpty()
    name: string;

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
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsNumber()
    @IsNotEmpty()
    otp: number;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}

/**
 * DTO for verifying user email registration.
 */
export class VerifyUserDTO {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsNumber()
    @IsNotEmpty()
    otp: number;
}

/**
 * DTO for user login.
 */
export class LoginDTO {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}
