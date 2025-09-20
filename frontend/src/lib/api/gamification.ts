'use client'

import { api } from './base'
import type { ApiResponse } from './config'

export interface UserStats {
  totalPoints: number
  availableGamingMinutes: number
  usedGamingMinutes: number
  currentStreakDays: number
  longestStreakDays: number
  level: number
  updatedAt?: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  totalPoints: number
  level: number
  currentStreakDays: number
  longestStreakDays: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  iconUrl: string
  badgeColor: string
  requirementType: 'streak' | 'points' | 'chores_completed' | 'level'
  requirementValue: number
  isActive: boolean
}

export interface UserAchievement {
  id: string
  earnedAt: string
  achievement: Achievement
}

export interface RedeemGamingTimeRequest {
  minutes: number
}

export interface RedeemGamingTimeResponse {
  availableGamingMinutes: number
  usedGamingMinutes: number
  redeemedMinutes: number
}

// Removed makeAuthenticatedRequest function - now using centralized api utility from base.ts

export const gamificationApi = {
  // Get user gamification stats
  async getUserStats(tenantId: string): Promise<ApiResponse<UserStats>> {
    return api.get(`/tenants/${tenantId}/gamification/stats`)
  },

  // Get tenant leaderboard
  async getTenantLeaderboard(tenantId: string): Promise<ApiResponse<LeaderboardEntry[]>> {
    return api.get(`/tenants/${tenantId}/gamification/leaderboard`)
  },

  // Get available achievements
  async getAvailableAchievements(tenantId: string): Promise<ApiResponse<Achievement[]>> {
    return api.get(`/tenants/${tenantId}/gamification/achievements`)
  },

  // Get user's earned achievements
  async getUserAchievements(tenantId: string): Promise<ApiResponse<UserAchievement[]>> {
    return api.get(`/tenants/${tenantId}/gamification/achievements/earned`)
  },

  // Redeem gaming time
  async redeemGamingTime(
    tenantId: string,
    request: RedeemGamingTimeRequest
  ): Promise<ApiResponse<RedeemGamingTimeResponse>> {
    return api.post(`/tenants/${tenantId}/gamification/redeem-time`, request)
  },
}