'use client'

import { useMutation } from '@tanstack/react-query'
import { TenantType, TenantMemberRole } from '@tiggpro/shared'
import { api } from './base'
import type { ApiResponse } from './config'

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

// Removed makeAuthenticatedRequest function - now using centralized api utility from base.ts

export const tenantsApi = {
  // Create a new tenant
  async createTenant(request: CreateTenantRequest): Promise<ApiResponse> {
    return api.post('/tenants', request)
  },

  // Join an existing tenant by code
  async joinTenant(request: JoinTenantRequest): Promise<ApiResponse> {
    return api.post('/tenants/join', request)
  },

  // Get user's tenants
  async getMyTenants(): Promise<ApiResponse<UserTenant[]>> {
    return api.get('/tenants/my')
  },

  // Get tenant members
  async getTenantMembers(tenantId: string): Promise<ApiResponse<TenantMember[]>> {
    return api.get(`/tenants/${tenantId}/members`)
  },

  // Invite a member to tenant
  async inviteMember(tenantId: string, request: InviteMemberRequest): Promise<ApiResponse> {
    return api.post(`/tenants/${tenantId}/invite`, request)
  },

  // Remove a member from tenant
  async removeMember(tenantId: string, userId: string): Promise<ApiResponse> {
    return api.delete(`/tenants/${tenantId}/members/${userId}`)
  },

  // Delete a tenant (only by admin)
  async deleteTenant(tenantId: string): Promise<ApiResponse> {
    return api.delete(`/tenants/${tenantId}/delete`)
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

// React Query hooks
export const useRemoveMember = () => {
  return useMutation({
    mutationFn: ({ tenantId, userId }: { tenantId: string; userId: string }) =>
      tenantsApi.removeMember(tenantId, userId),
  })
}

export const useDeleteTenant = () => {
  return useMutation({
    mutationFn: (tenantId: string) => tenantsApi.deleteTenant(tenantId),
  })
}
