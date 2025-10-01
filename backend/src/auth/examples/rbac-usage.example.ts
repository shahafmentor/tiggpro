import {
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { TenantMembershipGuard } from '@/auth/guards/tenant-membership.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { TenantMemberRole } from '@tiggpro/shared';
import type { ApiResponse } from '@tiggpro/shared';

/**
 * Example controller showing how to use RBAC system
 * This demonstrates the complete JWT + RBAC flow
 */
@Controller('tenants/:tenantId/chores')
@UseGuards(JwtAuthGuard, TenantMembershipGuard) // All routes require auth + tenant membership
export class ChoreController {
  // 🟢 Any authenticated tenant member can view chores
  @Get()
  getChores(@Param('tenantId') tenantId: string): ApiResponse {
    // User is authenticated and verified as tenant member
    // req.user contains: { id, email, displayName, provider }

    return {
      success: true,
      data: [], // Chores for this tenant
      message: `Chores for tenant ${tenantId}`,
    };
  }

  // 🟡 Only ADMIN and PARENT roles can create chores
  @Post()
  @UseGuards(RolesGuard)
  @Roles(TenantMemberRole.ADMIN, TenantMemberRole.PARENT)
  createChore(@Param('tenantId') tenantId: string): ApiResponse {
    // User is authenticated, tenant member, AND has ADMIN or PARENT role

    return {
      success: true,
      data: { message: 'Chore created' },
      message: `Chore created successfully for tenant ${tenantId}`,
    };
  }

  // 🔴 Only ADMIN can delete chores
  @Post(':choreId/delete')
  @UseGuards(RolesGuard)
  @Roles(TenantMemberRole.ADMIN)
  deleteChore(
    @Param('tenantId') tenantId: string,
    @Param('choreId') choreId: string,
  ): ApiResponse {
    // User is authenticated, tenant member, AND has ADMIN role

    return {
      success: true,
      message: `Chore ${choreId} deleted successfully for tenant ${tenantId}`,
    };
  }
}

/**
 * RBAC FLOW EXPLANATION:
 *
 * 1. 🔐 JWT Authentication (JwtAuthGuard)
 *    - Extracts JWT from Authorization header
 *    - Validates token signature & expiration
 *    - Loads user data and attaches to request.user
 *
 * 2. 🏠 Tenant Membership (TenantMembershipGuard)
 *    - Checks if authenticated user is member of tenant
 *    - Extracts tenantId from URL params/body/query
 *    - Queries tenant_members table
 *
 * 3. 👤 Role Authorization (RolesGuard)
 *    - Checks user's role within the specific tenant
 *    - Compares against required roles from @Roles decorator
 *    - Allows access only if user has sufficient role
 *
 * ROLE HIERARCHY:
 * - CHILD: Can view and complete assigned chores
 * - PARENT: Can do everything CHILD can + create/assign chores
 * - ADMIN: Can do everything + manage tenant settings & delete chores
 */
