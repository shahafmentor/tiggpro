/**
 * Centralized API exports
 *
 * This module provides a single entry point for all API functionality
 * across the frontend application.
 */

// Export centralized configuration and utilities
export { API_CONFIG, buildApiUrl } from './config'
export { api, makeAuthenticatedRequest } from './base'
export type { ApiResponse, ApiError } from './config'

// Export individual API modules
export { choresApi } from './chores'
export { assignmentsApi } from './assignments'
export { tenantsApi } from './tenants'
export { gamificationApi } from './gamification'

// Export types from individual modules
export type {
  CreateChoreRequest,
  UpdateChoreRequest,
  AssignChoreRequest,
  Chore,
} from './chores'

export type {
  Assignment,
  Submission,
  SubmitAssignmentRequest,
  ReviewSubmissionRequest,
} from './assignments'

export type {
  CreateTenantRequest,
  JoinTenantRequest,
  InviteMemberRequest,
  TenantMember,
  UserTenant,
} from './tenants'

export type {
  UserStats,
  LeaderboardEntry,
  Achievement,
  UserAchievement,
  RedeemGamingTimeRequest,
  RedeemGamingTimeResponse,
} from './gamification'

/**
 * Example usage:
 *
 * ```typescript
 * import { choresApi, API_CONFIG } from '@/lib/api'
 *
 * // Use centralized configuration
 * console.log('API Base URL:', API_CONFIG.BASE_URL)
 *
 * // Make API calls
 * const chores = await choresApi.getChoresByTenant(tenantId)
 * ```
 */

