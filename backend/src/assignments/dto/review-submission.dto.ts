import { IsEnum, IsString, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@tiggpro/shared';

export class ReviewSubmissionDto {
  @ApiProperty({
    description: 'Review status for the chore submission',
    enum: ReviewStatus,
    example: ReviewStatus.APPROVED,
  })
  @IsEnum(ReviewStatus)
  reviewStatus: ReviewStatus;

  @ApiPropertyOptional({
    description: 'Feedback from the reviewer',
    example: 'Great job! The room looks much better than before.',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Review feedback must not exceed 500 characters' })
  reviewFeedback?: string;

  @ApiPropertyOptional({
    description: 'Points awarded for the completed chore',
    example: 25,
    minimum: 0,
    maximum: 1000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Points awarded cannot be negative' })
  @Max(1000, { message: 'Points awarded must not exceed 1000' })
  pointsAwarded?: number;

  @ApiPropertyOptional({
    description: 'Gaming time awarded in minutes for the completed chore',
    example: 30,
    minimum: 0,
    maximum: 480,
  })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Gaming time awarded cannot be negative' })
  @Max(480, { message: 'Gaming time awarded must not exceed 8 hours (480 minutes)' })
  gamingTimeAwarded?: number;
}
