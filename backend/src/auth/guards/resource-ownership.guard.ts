import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

export interface ResourceOwnershipConfig {
  entity: string;
  userIdField: string;
  paramName?: string;
}

@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

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

    try {
      // Get the repository for the specified entity
      const repository = this.dataSource.getRepository(ownershipConfig.entity);

      // Query the resource to check ownership
      const resource = await repository.findOne({
        where: { id: resourceId },
      });

      if (!resource) {
        throw new ForbiddenException('Resource not found');
      }

      // Check if the user owns the resource
      const ownerUserId = resource[ownershipConfig.userIdField];

      if (ownerUserId !== user.id) {
        throw new ForbiddenException('You do not have permission to access this resource');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // Log the error for debugging but don't expose internal details
      console.error('ResourceOwnershipGuard error:', error);
      throw new ForbiddenException('Unable to verify resource ownership');
    }
  }
}

// Decorator to specify resource ownership configuration

export const RESOURCE_OWNERSHIP_KEY = 'resourceOwnership';
export const ResourceOwnership = (config: ResourceOwnershipConfig) =>
  SetMetadata(RESOURCE_OWNERSHIP_KEY, config);
