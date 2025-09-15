import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface ResourceOwnershipConfig {
  entity: string;
  userIdField: string;
  paramName?: string;
}

@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ownershipConfig = this.reflector.getAllAndOverride<ResourceOwnershipConfig>('resourceOwnership', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!ownershipConfig) {
      return true; // No ownership check required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params[ownershipConfig.paramName || 'id'];

    if (!user || !resourceId) {
      return false;
    }

    // For now, we'll implement a basic check
    // In a real implementation, this would query the database to verify ownership
    // based on the entity and userIdField specified in the config

    // This is a placeholder implementation that would need to be expanded
    // with actual database queries based on the entity type

    // Example usage would be:
    // @ResourceOwnership({ entity: 'Chore', userIdField: 'createdBy' })
    // This would check if the current user is the creator of the chore

    return true; // Placeholder - implement actual ownership logic
  }
}

// Decorator to specify resource ownership configuration

export const RESOURCE_OWNERSHIP_KEY = 'resourceOwnership';
export const ResourceOwnership = (config: ResourceOwnershipConfig) =>
  SetMetadata(RESOURCE_OWNERSHIP_KEY, config);
