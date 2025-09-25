import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardRedemption, UserPoints } from '@/entities';
import { TenantMemberRole, type ApiResponse, RewardType } from '@tiggpro/shared';
import { TenantsService } from '@/tenants/tenants.service';
import { RewardSettingsService } from './settings.service';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(RewardRedemption)
    private readonly redemptionRepo: Repository<RewardRedemption>,
    @InjectRepository(UserPoints)
    private readonly userPointsRepo: Repository<UserPoints>,
    private readonly tenantsService: TenantsService,
    private readonly settingsService: RewardSettingsService,
  ) {}
  private async ensureReviewer(tenantId: string, userId: string): Promise<void> {
    await this.tenantsService.verifyUserPermission(tenantId, userId, [TenantMemberRole.ADMIN, TenantMemberRole.PARENT]);
  }

  private async calculatePointCost(tenantId: string, type: RewardType, amount: number | null): Promise<number> {
    const settings = await this.settingsService.getSettings(tenantId);
    const conversion = settings.data?.conversion as any;

    if (!conversion) {
      // Default conversion rates if not configured
      const defaults = {
        [RewardType.GAMING_TIME]: 1, // 1 point per minute
        [RewardType.SPENDING_MONEY]: 10, // 10 points per currency unit
        [RewardType.SOCIAL_OUTING]: 50, // 50 points per outing
        [RewardType.SPECIAL_EXPERIENCE]: 100, // 100 points per experience
      };
      return defaults[type] * (amount || 1);
    }

    switch (type) {
      case RewardType.GAMING_TIME:
        return (conversion.pointsPerMinute || 1) * (amount || 1);
      case RewardType.SPENDING_MONEY:
        return (conversion.spendingMoney?.perUnit || 10) * (amount || 1);
      case RewardType.SOCIAL_OUTING:
        return conversion.fixedCosts?.socialOuting || 50;
      case RewardType.SPECIAL_EXPERIENCE:
        return conversion.fixedCosts?.specialExperience || 100;
      default:
        return 0;
    }
  }

  async requestRedemption(
    tenantId: string,
    userId: string,
    dto: any,
  ): Promise<ApiResponse> {
    // Ensure tenant membership
    await this.tenantsService.verifyUserMembership(tenantId, userId);

    const redemption = this.redemptionRepo.create({
      tenantId,
      userId,
      type: dto.type,
      amount: dto.amount ?? null,
      notes: dto.notes ?? null,
    });

    const saved = await this.redemptionRepo.save(redemption);
    return { success: true, data: saved };
  }

  async listRedemptions(tenantId: string, userId: string): Promise<ApiResponse> {
    // Parents/Admins see all; Children see their own
    const membership = await this.tenantsService.getMembership(tenantId, userId);
    const isReviewer = [TenantMemberRole.ADMIN, TenantMemberRole.PARENT].includes(membership.role);

    const where = isReviewer ? { tenantId } : { tenantId, userId };
    const list = await this.redemptionRepo.find({ where, order: { requestedAt: 'DESC' } });
    return { success: true, data: list };
  }

  async approveRedemption(
    tenantId: string,
    redemptionId: string,
    reviewerId: string,
    dto: any,
  ): Promise<ApiResponse> {
    await this.ensureReviewer(tenantId, reviewerId);

    const redemption = await this.redemptionRepo.findOne({ where: { id: redemptionId, tenantId } });
    if (!redemption) throw new NotFoundException('Redemption not found');

    // Calculate point cost
    const pointCost = await this.calculatePointCost(tenantId, redemption.type, redemption.amount);

    // Check user's available points
    const userPoints = await this.userPointsRepo.findOne({
      where: { userId: redemption.userId, tenantId }
    });

    if (!userPoints) {
      throw new BadRequestException('User points record not found');
    }

    if (userPoints.availablePoints < pointCost) {
      throw new BadRequestException(`Insufficient points. Required: ${pointCost}, Available: ${userPoints.availablePoints}`);
    }

    // Deduct points
    userPoints.availablePoints -= pointCost;
    userPoints.spentPoints += pointCost;

    // Update redemption status
    redemption.status = 'approved' as any;
    redemption.decidedBy = reviewerId;
    redemption.decidedAt = new Date();

    // Save both records
    await this.userPointsRepo.save(userPoints);
    const saved = await this.redemptionRepo.save(redemption);

    return {
      success: true,
      data: {
        redemption: saved,
        pointCost,
        remainingPoints: userPoints.availablePoints
      }
    };
  }

  async rejectRedemption(
    tenantId: string,
    redemptionId: string,
    reviewerId: string,
    dto: any,
  ): Promise<ApiResponse> {
    await this.ensureReviewer(tenantId, reviewerId);

    const redemption = await this.redemptionRepo.findOne({ where: { id: redemptionId, tenantId } });
    if (!redemption) throw new NotFoundException('Redemption not found');

    redemption.status = 'rejected' as any;
    redemption.decidedBy = reviewerId;
    redemption.decidedAt = new Date();
    // Optionally store rejection reason in notes (append)
    if (dto.reason) redemption.notes = redemption.notes ? `${redemption.notes}\nRejected: ${dto.reason}` : `Rejected: ${dto.reason}`;

    const saved = await this.redemptionRepo.save(redemption);
    return { success: true, data: saved };
  }

  async getCostPreview(
    tenantId: string,
    userId: string,
    body: { type: string; amount?: number },
  ): Promise<ApiResponse> {
    // Ensure tenant membership
    await this.tenantsService.verifyUserMembership(tenantId, userId);

    // Calculate point cost
    const pointCost = await this.calculatePointCost(tenantId, body.type as RewardType, body.amount || null);

    // Get user's available points
    const userPoints = await this.userPointsRepo.findOne({
      where: { userId, tenantId }
    });

    const availablePoints = userPoints?.availablePoints || 0;
    const remainingPoints = availablePoints - pointCost;

    return {
      success: true,
      data: {
        pointCost,
        remainingPoints
      }
    };
  }
}


