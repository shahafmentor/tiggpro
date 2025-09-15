import { IsString, IsOptional, IsArray, IsUrl, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAssignmentDto {
  @ApiPropertyOptional({
    description: 'Notes from the child about their submission',
    example: 'I cleaned everything and also organized my bookshelf!',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Submission notes must not exceed 1000 characters' })
  submissionNotes?: string;

  @ApiPropertyOptional({
    description: 'URLs to photos or videos showing the completed chore',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsUrl({}, { each: true, message: 'Each media URL must be valid' })
  mediaUrls?: string[];
}
