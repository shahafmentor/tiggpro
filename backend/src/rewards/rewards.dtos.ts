import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RewardType } from '@tiggpro/shared';

export class CreateRedemptionDto {
  @ApiProperty({ enum: RewardType })
  @IsEnum(RewardType)
  type: RewardType;

  @ApiProperty({
    required: false,
    description: 'Minutes or monetary amount, when applicable',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveRedemptionDto {
  // Reserved for future fields (e.g., override amount)
}

export class RejectRedemptionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
