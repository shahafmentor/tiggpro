'use client'

import { TenantType, TenantMemberRole } from '@tiggpro/shared'
import { getAuthToken } from '@/lib/auth-utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface CreateTenantRequest {
  name: string
  type: TenantType
}

interface JoinTenantRequest {
  tenantCode: string
}

interface InviteMemberRequest {
  email: string
  role: TenantMemberRole
  message?: string
}

interface TenantMember {
  id: string
  userId: string
  role: TenantMemberRole
  joinedAt: string
  user: {
    id: string
    email: string
    displayName: string
    avatarUrl?: string
  }
}

interface UserTenant {
  membershipId: string
  role: TenantMemberRole
  joinedAt: string
  tenant: {
    id: string
    name: string
    tenantCode: string
    type: TenantType
  }
}

async function makeAuthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get real JWT token from NextAuth session
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

export const tenantsApi = {
  // Create a new tenant
  async createTenant(request: CreateTenantRequest): Promise<ApiResponse> {
    return makeAuthenticatedRequest('/tenants', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // Join an existing tenant by code
  async joinTenant(request: JoinTenantRequest): Promise<ApiResponse> {
    return makeAuthenticatedRequest('/tenants/join', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // Get user's tenants
  async getMyTenants(): Promise<ApiResponse<UserTenant[]>> {
    return makeAuthenticatedRequest('/tenants/my')
  },

  // Get tenant members
  async getTenantMembers(tenantId: string): Promise<ApiResponse<TenantMember[]>> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/members`)
  },

  // Invite a member to tenant
  async inviteMember(tenantId: string, request: InviteMemberRequest): Promise<ApiResponse> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/invite`, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // Remove a member from tenant
  async removeMember(tenantId: string, userId: string): Promise<ApiResponse> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/members/${userId}`, {
      method: 'DELETE',
    })
  },
}

export type {
  CreateTenantRequest,
  JoinTenantRequest,
  InviteMemberRequest,
  TenantMember,
  UserTenant,
  ApiResponse
}
