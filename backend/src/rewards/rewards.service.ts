import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardRedemption } from '@/entities';
import { TenantMemberRole, type ApiResponse } from '@tiggpro/shared';
// Temporarily avoid type import to satisfy linter module resolution
import { TenantsService } from '@/tenants/tenants.service';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(RewardRedemption)
    private readonly redemptionRepo: Repository<RewardRedemption>,
    private readonly tenantsService: TenantsService,
  ) {}
  private async ensureReviewer(tenantId: string, userId: string): Promise<void> {
    await this.tenantsService.verifyUserPermission(tenantId, userId, [TenantMemberRole.ADMIN, TenantMemberRole.PARENT]);
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

    redemption.status = 'approved' as any; // enum mapped via shared types
    redemption.decidedBy = reviewerId;
    redemption.decidedAt = new Date();

    // MVP: only adjust balances for gaming time elsewhere (integration point)
    const saved = await this.redemptionRepo.save(redemption);
    return { success: true, data: saved };
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
}


