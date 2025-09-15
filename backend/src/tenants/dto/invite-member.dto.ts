import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantMemberRole } from '@tiggpro/shared';

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the person to invite',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Role to assign to the new member',
    enum: TenantMemberRole,
    example: TenantMemberRole.CHILD,
  })
  @IsEnum(TenantMemberRole)
  role: TenantMemberRole;

  @ApiPropertyOptional({
    description: 'Optional invitation message',
    example: 'Welcome to our family chore management system!',
  })
  @IsString()
  @IsOptional()
  message?: string;
}
