import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing user's profile.
 * Used by PUT /user/:id — all fields are optional (patch semantics).
 */
export class UpdateUserDTO {
  @ApiPropertyOptional({
    description: 'The updated name of the user',
    example: 'John Smith',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({
    description: 'The updated email address of the user',
    example: 'john.smith@example.com',
  })
  @IsString()
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description:
      'The updated password for the user account (minimum 8 characters)',
    example: 'NewSecurePassword123',
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password: string;
}
