import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';

@Injectable()
export class TenantMembershipGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.params.tenantId || request.body.tenantId || request.query.tenantId;

    if (!user) {
      return false; // No authenticated user
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required for this operation');
    }

    // Check if user is a member of the tenant
    const isMember = await this.authService.isUserMemberOfTenant(user.id, tenantId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this tenant');
    }

    return true;
  }
}
