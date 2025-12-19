'use client'

import { DifficultyLevel, Priority } from '@tiggpro/shared'
import { api } from './base'
import type { ApiResponse } from './config'

interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly'
  daysOfWeek?: number[] // 0-6, Sunday = 0
  dayOfMonth?: number // 1-31
}

interface CreateChoreRequest {
  title: string
  description?: string
  pointsReward: number
  difficultyLevel: DifficultyLevel
  estimatedDurationMinutes: number
  isRecurring: boolean
  recurrencePattern?: RecurrencePattern
}

interface UpdateChoreRequest extends Partial<CreateChoreRequest> {}

interface AssignChoreRequest {
  assignedTo: string
  dueDate: string
  priority: Priority
  notes?: string
}

interface AssignCustomChoreRequest extends CreateChoreRequest, AssignChoreRequest {
  saveAsTemplate?: boolean
}

interface Chore {
  id: string
  tenantId: string
  title: string
  description?: string
  pointsReward: number
  difficultyLevel: DifficultyLevel
  estimatedDurationMinutes: number
  isRecurring: boolean
  recurrencePattern?: RecurrencePattern
  createdBy: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ActiveTemplateAssignment {
  id: string
  choreInstanceId: string
  status: string
  dueDate: string
  priority: Priority
  createdAt: string
  assignedTo?: {
    id: string
    email: string
    displayName: string
    avatarUrl?: string
  }
  assignedBy?: {
    id: string
    email: string
    displayName: string
    avatarUrl?: string
  }
}

// Removed makeAuthenticatedRequest function - now using centralized api utility from base.ts

export const choresApi = {
  // Create a new chore
  async createChore(tenantId: string, request: CreateChoreRequest): Promise<ApiResponse<Chore>> {
    return api.post(`/tenants/${tenantId}/chores`, request)
  },

  // Get all chores for a tenant
  async getChoresByTenant(tenantId: string): Promise<ApiResponse<Chore[]>> {
    return api.get(`/tenants/${tenantId}/chores`)
  },

  // Get a specific chore
  async getChore(tenantId: string, choreId: string): Promise<ApiResponse<Chore>> {
    return api.get(`/tenants/${tenantId}/chores/${choreId}`)
  },

  // Update a chore
  async updateChore(tenantId: string, choreId: string, request: UpdateChoreRequest): Promise<ApiResponse<Chore>> {
    return api.put(`/tenants/${tenantId}/chores/${choreId}`, request)
  },

  // Delete a chore
  async deleteChore(tenantId: string, choreId: string): Promise<ApiResponse> {
    return api.delete(`/tenants/${tenantId}/chores/${choreId}`)
  },

  // Assign a chore to a user
  async assignChore(tenantId: string, choreId: string, request: AssignChoreRequest): Promise<ApiResponse> {
    return api.post(`/tenants/${tenantId}/chores/${choreId}/assign`, request)
  },

  // Assign a custom chore (one-off or save-as-template)
  async assignCustomChore(tenantId: string, request: AssignCustomChoreRequest): Promise<ApiResponse> {
    return api.post(`/tenants/${tenantId}/chores/assign-custom`, request)
  },

  // Template-centric: get active assignments for a chore template
  async getActiveAssignmentsForTemplate(
    tenantId: string,
    choreId: string
  ): Promise<ApiResponse<ActiveTemplateAssignment[]>> {
    return api.get(`/tenants/${tenantId}/chores/${choreId}/assignments/active`)
  },
}

export type {
  CreateChoreRequest,
  UpdateChoreRequest,
  AssignChoreRequest,
  AssignCustomChoreRequest,
  Chore,
  ActiveTemplateAssignment,
  RecurrencePattern,
  ApiResponse
}
