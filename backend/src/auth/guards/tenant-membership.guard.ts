import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';

@Injectable()
export class TenantMembershipGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    if (!user) {
      return false; // No authenticated user
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required for this operation');
    }

    // Check if user is a member of the tenant

    const isMember = await this.authService.isUserMemberOfTenant(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      user.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      tenantId,
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this tenant');
    }

    return true;
  }
}
