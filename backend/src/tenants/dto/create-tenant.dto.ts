import { IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantType } from '@tiggpro/shared';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Name of the tenant (family/organization)',
    example: 'The Smith Family',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  @MinLength(2, { message: 'Tenant name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Tenant name must not exceed 50 characters' })
  name: string;

  @ApiProperty({
    description: 'Type of tenant',
    enum: TenantType,
    example: TenantType.FAMILY
  })
  @IsEnum(TenantType)
  type: TenantType;
}
