'use client'

import { DifficultyLevel, Priority } from '@tiggpro/shared'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly'
  daysOfWeek?: number[] // 0-6, Sunday = 0
  dayOfMonth?: number // 1-31
}

interface CreateChoreRequest {
  title: string
  description?: string
  pointsReward: number
  gamingTimeMinutes: number
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

interface Chore {
  id: string
  tenantId: string
  title: string
  description?: string
  pointsReward: number
  gamingTimeMinutes: number
  difficultyLevel: DifficultyLevel
  estimatedDurationMinutes: number
  isRecurring: boolean
  recurrencePattern?: RecurrencePattern
  createdBy: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

async function makeAuthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // TODO: Get JWT token from NextAuth session
    const token = 'placeholder-jwt-token'

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

export const choresApi = {
  // Create a new chore
  async createChore(tenantId: string, request: CreateChoreRequest): Promise<ApiResponse<Chore>> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/chores`, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // Get all chores for a tenant
  async getChores(tenantId: string): Promise<ApiResponse<Chore[]>> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/chores`)
  },

  // Get a specific chore
  async getChore(tenantId: string, choreId: string): Promise<ApiResponse<Chore>> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/chores/${choreId}`)
  },

  // Update a chore
  async updateChore(tenantId: string, choreId: string, request: UpdateChoreRequest): Promise<ApiResponse<Chore>> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/chores/${choreId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    })
  },

  // Delete a chore
  async deleteChore(tenantId: string, choreId: string): Promise<ApiResponse> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/chores/${choreId}`, {
      method: 'DELETE',
    })
  },

  // Assign a chore to a user
  async assignChore(tenantId: string, choreId: string, request: AssignChoreRequest): Promise<ApiResponse> {
    return makeAuthenticatedRequest(`/tenants/${tenantId}/chores/${choreId}/assign`, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },
}

export type {
  CreateChoreRequest,
  UpdateChoreRequest,
  AssignChoreRequest,
  Chore,
  RecurrencePattern,
  ApiResponse
}
