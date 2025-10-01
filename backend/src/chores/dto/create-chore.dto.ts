import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DifficultyLevel } from '@tiggpro/shared';
import type { RecurrencePattern } from '@tiggpro/shared';

export class CreateChoreDto {
  @ApiProperty({
    description: 'The title of the chore',
    example: 'Clean your room',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Chore title must be at least 2 characters long' })
  @MaxLength(100, { message: 'Chore title must not exceed 100 characters' })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the chore',
    example: 'Make your bed, organize your desk, and vacuum the floor',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Points awarded for completing this chore',
    example: 25,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber()
  @Min(1, { message: 'Points reward must be at least 1' })
  @Max(1000, { message: 'Points reward must not exceed 1000' })
  pointsReward: number;

  @ApiProperty({
    description: 'Difficulty level of the chore',
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIUM,
  })
  @IsEnum(DifficultyLevel)
  difficultyLevel: DifficultyLevel;

  @ApiProperty({
    description: 'Estimated time to complete the chore in minutes',
    example: 45,
    minimum: 5,
    maximum: 480,
  })
  @IsNumber()
  @Min(5, { message: 'Estimated duration must be at least 5 minutes' })
  @Max(480, {
    message: 'Estimated duration must not exceed 8 hours (480 minutes)',
  })
  estimatedDurationMinutes: number;

  @ApiProperty({
    description: 'Whether this chore repeats on a schedule',
    example: true,
  })
  @IsBoolean()
  isRecurring: boolean;

  @ApiPropertyOptional({
    description: 'Recurrence pattern for repeating chores',
    example: {
      type: 'weekly',
      daysOfWeek: [1, 3, 5],
      interval: 1,
    },
  })
  @IsOptional()
  @IsObject()
  recurrencePattern?: RecurrencePattern;
}
