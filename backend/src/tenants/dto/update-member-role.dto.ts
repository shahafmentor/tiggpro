import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantMemberRole } from '@tiggpro/shared';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New role to assign to the member',
    enum: TenantMemberRole,
    example: TenantMemberRole.PARENT,
  })
  @IsEnum(TenantMemberRole, { message: 'Please provide a valid role' })
  role: TenantMemberRole;
}
