import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardSettings } from '@/entities';
import type { ApiResponse, RewardType } from '@tiggpro/shared';

@Injectable()
export class RewardSettingsService {
  constructor(
    @InjectRepository(RewardSettings)
    private readonly settingsRepo: Repository<RewardSettings>,
  ) {}

  async getSettings(tenantId: string): Promise<ApiResponse> {
    let settings = await this.settingsRepo.findOne({ where: { tenantId } });
    if (!settings) {
      // Create default settings if missing
      settings = this.settingsRepo.create({ tenantId, enabledTypes: ['gaming_time'] as unknown as RewardType[] });
      settings = await this.settingsRepo.save(settings);
    }
    return { success: true, data: settings };
  }

  async updateSettings(tenantId: string, body: { enabledTypes?: RewardType[]; conversion?: Record<string, unknown> }): Promise<ApiResponse> {
    let settings = await this.settingsRepo.findOne({ where: { tenantId } });
    if (!settings) {
      settings = this.settingsRepo.create({ tenantId, enabledTypes: [] });
    }
    if (body.enabledTypes) settings.enabledTypes = body.enabledTypes;
    if (body.conversion !== undefined) settings.conversion = body.conversion as any;
    settings = await this.settingsRepo.save(settings);
    return { success: true, data: settings };
  }
}


