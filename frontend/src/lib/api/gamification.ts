'use client'

import { getAuthToken } from '@/lib/auth-utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

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

async function makeAuthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken()

    if (!token) {
      return {
        success: false,
        error: 'Authentication required. Please sign in.',
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

export const gamificationApi = {
  // Get user gamification stats
  async getUserStats(tenantId: string): Promise<ApiResponse<UserStats>> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/gamification/stats`)
  },

  // Get tenant leaderboard
  async getTenantLeaderboard(tenantId: string): Promise<ApiResponse<LeaderboardEntry[]>> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/gamification/leaderboard`)
  },

  // Get available achievements
  async getAvailableAchievements(tenantId: string): Promise<ApiResponse<Achievement[]>> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/gamification/achievements`)
  },

  // Get user's earned achievements
  async getUserAchievements(tenantId: string): Promise<ApiResponse<UserAchievement[]>> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/gamification/achievements/earned`)
  },

  // Redeem gaming time
  async redeemGamingTime(
    tenantId: string,
    request: RedeemGamingTimeRequest
  ): Promise<ApiResponse<RedeemGamingTimeResponse>> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/gamification/redeem-time`, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },
}