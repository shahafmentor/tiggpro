import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsString,
} from 'class-validator';
import { Priority } from '@tiggpro/shared';
import { CreateChoreDto } from './create-chore.dto';

export class AssignCustomChoreDto extends CreateChoreDto {
  @ApiProperty({
    description: 'User ID to assign the chore to',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Assigned user ID must be a valid UUID' })
  assignedTo: string;

  @ApiProperty({
    description: 'Due date for the chore completion',
    example: '2024-01-15T10:00:00Z',
    format: 'date-time',
  })
  @IsDateString({}, { message: 'Due date must be a valid date' })
  dueDate: string;

  @ApiProperty({
    description: 'Priority level of the chore assignment',
    enum: Priority,
    example: Priority.MEDIUM,
  })
  @IsEnum(Priority)
  priority: Priority;

  @ApiPropertyOptional({
    description: 'Additional notes for the chore assignment',
    example: 'Please focus on organizing the closet area',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'If true, create a chore template first and then assign an instance referencing it',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  saveAsTemplate?: boolean = false;
}
