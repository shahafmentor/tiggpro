import { IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { TenantType } from '@tiggpro/shared';

export class CreateTenantDto {
  @IsString()
  @MinLength(2, { message: 'Tenant name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Tenant name must not exceed 50 characters' })
  name: string;

  @IsEnum(TenantType)
  type: TenantType;
}
