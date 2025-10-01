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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user = request.user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tenantId =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.params.tenantId ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request.body.tenantId as string) ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request.query.tenantId as string);

    if (!user || !tenantId) {
      return false; // No user or tenant context
    }

    // Get user's role in the specific tenant

    const userRole = await this.authService.getUserRoleInTenant(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      user.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      tenantId,
    );

    if (!userRole) {
      return false; // User is not a member of this tenant
    }

    // Check if user's role meets the requirements
    return requiredRoles.includes(userRole);
  }
}
