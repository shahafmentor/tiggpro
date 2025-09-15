import { SetMetadata } from '@nestjs/common';
import { TenantMemberRole } from '@tiggpro/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: TenantMemberRole[]) => SetMetadata(ROLES_KEY, roles);
