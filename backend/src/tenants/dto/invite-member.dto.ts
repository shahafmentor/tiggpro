import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { TenantMemberRole } from '@tiggpro/shared';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsEnum(TenantMemberRole)
  role: TenantMemberRole;

  @IsString()
  @IsOptional()
  message?: string;
}
