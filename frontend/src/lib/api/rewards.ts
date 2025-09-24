import { api } from './base'
import type { ApiResponse, RewardRedemption, RewardSettings, RewardType } from '@tiggpro/shared'

export interface CreateRedemptionRequest {
  type: RewardType
  amount?: number
  notes?: string
}

export interface UpdateSettingsRequest {
  enabledTypes?: RewardType[]
  defaultConversion?: Record<string, unknown>
}

export const rewardsApi = {
  async requestRedemption(tenantId: string, body: CreateRedemptionRequest): Promise<ApiResponse<RewardRedemption>> {
    return api.post(`/tenants/${tenantId}/rewards/redemptions`, body)
  },

  async listRedemptions(tenantId: string): Promise<ApiResponse<RewardRedemption[]>> {
    return api.get(`/tenants/${tenantId}/rewards/redemptions`)
  },

  async approveRedemption(tenantId: string, redemptionId: string): Promise<ApiResponse<RewardRedemption>> {
    return api.put(`/tenants/${tenantId}/rewards/redemptions/${redemptionId}/approve`, {})
  },

  async rejectRedemption(tenantId: string, redemptionId: string, reason?: string): Promise<ApiResponse<RewardRedemption>> {
    return api.put(`/tenants/${tenantId}/rewards/redemptions/${redemptionId}/reject`, { reason })
  },

  async getSettings(tenantId: string): Promise<ApiResponse<RewardSettings>> {
    return api.get(`/tenants/${tenantId}/rewards/settings`)
  },

  async updateSettings(tenantId: string, body: UpdateSettingsRequest): Promise<ApiResponse<RewardSettings>> {
    return api.put(`/tenants/${tenantId}/rewards/settings`, body)
  }
}



