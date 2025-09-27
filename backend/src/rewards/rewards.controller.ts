import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TenantMembershipGuard } from '@/auth/guards/tenant-membership.guard';
import type { ApiResponse } from '@tiggpro/shared';
import { RewardsService } from './rewards.service';
import { RewardSettingsService } from './settings.service';
import { CreateRedemptionDto, ApproveRedemptionDto, RejectRedemptionDto } from './rewards.dtos';

@ApiTags('rewards')
@ApiBearerAuth()
@Controller('tenants/:tenantId/rewards')
@UseGuards(JwtAuthGuard, TenantMembershipGuard)
export class RewardsController {
  constructor(
    private readonly rewardsService: RewardsService,
    private readonly settingsService: RewardSettingsService,
  ) {}

  @Post('redemptions')
  @ApiOperation({ summary: 'Request a reward redemption' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  async requestRedemption(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateRedemptionDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    return this.rewardsService.requestRedemption(tenantId, req.user.id, dto);
  }

  @Get('redemptions')
  @ApiOperation({ summary: 'List reward redemptions' })
  async listRedemptions(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    return this.rewardsService.listRedemptions(tenantId, req.user.id);
  }

  @Get('redemptions/pending')
  @ApiOperation({ summary: 'Get pending reward redemptions for review' })
  async getPendingRedemptions(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    return this.rewardsService.getPendingRedemptions(tenantId, req.user.id);
  }

  @Put('redemptions/:id/approve')
  @ApiOperation({ summary: 'Approve a reward redemption' })
  async approveRedemption(
    @Param('tenantId') tenantId: string,
    @Param('id') redemptionId: string,
    @Body() dto: ApproveRedemptionDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    return this.rewardsService.approveRedemption(tenantId, redemptionId, req.user.id, dto);
  }

  @Put('redemptions/:id/reject')
  @ApiOperation({ summary: 'Reject a reward redemption' })
  async rejectRedemption(
    @Param('tenantId') tenantId: string,
    @Param('id') redemptionId: string,
    @Body() dto: RejectRedemptionDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    return this.rewardsService.rejectRedemption(tenantId, redemptionId, req.user.id, dto);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get tenant reward settings' })
  async getSettings(
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponse> {
    return this.settingsService.getSettings(tenantId);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update tenant reward settings' })
  async updateSettings(
    @Param('tenantId') tenantId: string,
    @Body() body: any,
  ): Promise<ApiResponse> {
    return this.settingsService.updateSettings(tenantId, body);
  }

  @Post('cost-preview')
  @ApiOperation({ summary: 'Get cost preview for a reward redemption' })
  async getCostPreview(
    @Param('tenantId') tenantId: string,
    @Body() body: { type: string; amount?: number },
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    return this.rewardsService.getCostPreview(tenantId, req.user.id, body);
  }
}


