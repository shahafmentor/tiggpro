import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantMemberRole } from '@tiggpro/shared';
import { AuthService } from '@/auth/auth.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<TenantMemberRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId =
      request.params.tenantId ||
      request.body.tenantId ||
      request.query.tenantId;

    if (!user || !tenantId) {
      return false; // No user or tenant context
    }

    // Get user's role in the specific tenant
    const userRole = await this.authService.getUserRoleInTenant(
      user.id,
      tenantId,
    );

    if (!userRole) {
      return false; // User is not a member of this tenant
    }

    // Check if user's role meets the requirements
    return requiredRoles.includes(userRole);
  }
}
