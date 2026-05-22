import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDTO {
  @ApiProperty({
    description: 'The unique name of the role',
    example: 'support-agent',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'A description of what permissions the role holds',
    example: 'Handles customer support queries and ticket resolution',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateRoleDTO {
  @ApiPropertyOptional({
    description: 'The updated name of the role',
    example: 'senior-agent',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({
    description: 'The updated description of the role',
    example: 'Handles escalation and support queries',
  })
  @IsString()
  @IsOptional()
  description: string;
}
