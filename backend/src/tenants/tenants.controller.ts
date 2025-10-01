import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiDoc,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import {
  CreateTenantDto,
  InviteMemberDto,
  JoinTenantDto,
  UpdateMemberRoleDto,
} from './dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TenantMembershipGuard } from '@/auth/guards/tenant-membership.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { TenantMemberRole } from '@tiggpro/shared';
import type { ApiResponse } from '@tiggpro/shared';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant (family/organization)' })
  @ApiDoc({ status: 201, description: 'Tenant created successfully' })
  @ApiDoc({ status: 400, description: 'Invalid tenant data' })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const tenant = await this.tenantsService.createTenant(
        createTenantDto,
        req.user.id,
      );

      return {
        success: true,
        data: tenant,
        message: 'Tenant created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create tenant',
      };
    }
  }

  @Get(':tenantId/members')
  @UseGuards(TenantMembershipGuard)
  async getTenantMembers(
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponse> {
    try {
      const members = await this.tenantsService.getTenantMembers(tenantId);

      return {
        success: true,
        data: members.map((member) => ({
          id: member.id,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user
            ? {
                id: member.user.id,
                email: member.user.email,
                displayName: member.user.displayName,
                avatarUrl: member.user.avatarUrl,
              }
            : null,
        })),
        message: 'Tenant members retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get tenant members',
      };
    }
  }

  @Post(':tenantId/invite')
  @UseGuards(TenantMembershipGuard, RolesGuard)
  @Roles(TenantMemberRole.ADMIN, TenantMemberRole.PARENT)
  @HttpCode(HttpStatus.OK)
  async inviteMember(
    @Param('tenantId') tenantId: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      await this.tenantsService.inviteMember(
        tenantId,
        inviteMemberDto,
        req.user.id,
      );

      return {
        success: true,
        message: 'Member invited successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to invite member',
      };
    }
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  async joinTenant(
    @Body() joinTenantDto: JoinTenantDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const tenant = await this.tenantsService.joinTenant(
        joinTenantDto,
        req.user.id,
      );

      return {
        success: true,
        data: tenant,
        message: 'Successfully joined tenant',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join tenant',
      };
    }
  }

  @Get('my')
  async getMyTenants(
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const tenants = await this.tenantsService.getUserTenants(req.user.id);

      return {
        success: true,
        data: tenants.map((membership) => ({
          membershipId: membership.id,
          role: membership.role,
          joinedAt: membership.joinedAt,
          tenant: membership.tenant
            ? {
                id: membership.tenant.id,
                name: membership.tenant.name,
                tenantCode: membership.tenant.tenantCode,
                type: membership.tenant.type,
              }
            : null,
        })),
        message: 'User tenants retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get user tenants',
      };
    }
  }

  @Delete(':tenantId/members/:userId')
  @UseGuards(TenantMembershipGuard, RolesGuard)
  @Roles(TenantMemberRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ): Promise<ApiResponse> {
    try {
      await this.tenantsService.removeMember(tenantId, userId);

      return {
        success: true,
        message: 'Member removed successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to remove member',
      };
    }
  }

  @Patch(':tenantId/members/:userId/role')
  @UseGuards(TenantMembershipGuard, RolesGuard)
  @Roles(TenantMemberRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'userId', description: 'User ID to update role for' })
  @ApiDoc({ status: 200, description: 'Member role updated successfully' })
  @ApiDoc({
    status: 403,
    description: 'Forbidden - only admins can update roles',
  })
  @ApiDoc({ status: 404, description: 'Member not found' })
  async updateMemberRole(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ): Promise<ApiResponse> {
    try {
      const updatedMembership = await this.tenantsService.updateMemberRole(
        tenantId,
        userId,
        updateMemberRoleDto,
      );

      return {
        success: true,
        data: {
          id: updatedMembership.id,
          userId: updatedMembership.userId,
          role: updatedMembership.role,
          joinedAt: updatedMembership.joinedAt,
        },
        message: 'Member role updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update member role',
      };
    }
  }

  @Delete(':tenantId/delete')
  @UseGuards(JwtAuthGuard, TenantMembershipGuard, RolesGuard)
  @Roles(TenantMemberRole.ADMIN)
  @ApiOperation({ summary: 'Delete a tenant (only by admin)' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID to delete' })
  @ApiDoc({ status: 200, description: 'Tenant deleted successfully' })
  @ApiDoc({
    status: 403,
    description: 'Forbidden - only admins can delete tenants',
  })
  @ApiDoc({ status: 404, description: 'Tenant not found' })
  async deleteTenant(
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponse> {
    try {
      await this.tenantsService.deleteTenant(tenantId);
      return {
        success: true,
        message: 'Tenant deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete tenant',
      };
    }
  }
}
