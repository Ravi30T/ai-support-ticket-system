import { IsEmail, IsString, IsOptional, MinLength } from "class-validator";

/**
 * DTO for updating an existing user's profile.
 * Used by PUT /user/:id — all fields are optional (patch semantics).
 */
export class UpdateUserDTO {
    @IsString()
    @IsOptional()
    name: string;

    @IsString()
    @IsOptional()
    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    @MinLength(8)
    password: string;
}
