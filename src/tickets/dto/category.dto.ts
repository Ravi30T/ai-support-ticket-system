import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDTO {
  @ApiProperty({
    description: 'The name of the category',
    example: 'Technical Support',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'A brief description of what this category is for',
    example: 'Issues related to website, app, database or code queries',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
