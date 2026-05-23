import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTicketDTO {
  @ApiProperty({
    description: 'The title of the support ticket',
    example: 'Cannot access billing page',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'When I click on the billing tab, I receive a 500 error screen.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'The ID of the category this ticket belongs to',
    example: '65f8c67c51480e6080373ab1',
  })
  @IsOptional()
  @IsMongoId()
  category?: string;
}

export class UpdateTicketStatusDTO {
  @ApiProperty({
    description: 'The new status of the ticket',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    example: 'in_progress',
  })
  @IsEnum(['open', 'in_progress', 'resolved', 'closed'], {
    message: 'Status must be one of: open, in_progress, resolved, closed',
  })
  @IsNotEmpty()
  status: string;
}

export class AssignTicketDTO {
  @ApiProperty({
    description: 'The user ID of the admin agent to assign the ticket to',
    example: '65f8c67c51480e6080373ab2',
  })
  @IsMongoId()
  @IsNotEmpty()
  agentId: string;
}

export class AddCommentDTO {
  @ApiProperty({
    description: 'The message body of the comment or reply',
    example: 'I have checked our systems and the issue is now resolved.',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class GetTicketsQueryDTO {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by ticket status',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
  })
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
  })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional({
    description: 'Search string for title or description',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class GetActivitiesQueryDTO {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
