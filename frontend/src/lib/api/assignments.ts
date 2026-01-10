'use client'

import { Priority, AssignmentStatus, ReviewStatus } from '@tiggpro/shared'
import { api } from './base'
import type { ApiResponse } from './config'

interface SubmitAssignmentRequest {
  submissionNotes?: string
  mediaUrls?: string[]
}

interface ReviewSubmissionRequest {
  reviewStatus: 'approved' | 'rejected'
  reviewFeedback?: string
  pointsAwarded?: number
}

interface AssignmentSubmission {
  id: string
  submittedAt: string
  reviewStatus: ReviewStatus
  reviewFeedback?: string
  pointsAwarded?: number
  reviewedAt?: string
  reviewer?: {
    id: string
    displayName: string
  }
}

interface Assignment {
  id: string
  choreInstanceId: string
  dueDate: string
  priority: Priority
  status: AssignmentStatus
  createdAt: string
  chore: {
    id: string
    title: string
    description?: string
    pointsReward: number
    difficultyLevel: string
    estimatedDurationMinutes: number
  }
  assignedTo: {
    id: string
    email: string
    displayName: string
    avatarUrl?: string
  }
  assignedBy: {
    id: string
    email: string
    displayName: string
    avatarUrl?: string
  }
  submissions?: AssignmentSubmission[]
}

interface Submission {
  id: string
  assignmentId: string
  submissionNotes?: string
  mediaUrls?: string[]
  submittedAt: string
  reviewStatus: ReviewStatus
  reviewFeedback?: string
  pointsAwarded?: number
  reviewedAt?: string
  reviewedBy?: {
    id: string
    email: string
    displayName: string
  }
  assignment?: Assignment
}

// Removed makeAuthenticatedRequest function - now using centralized api utility from base.ts

export const assignmentsApi = {
  // Get user assignments
  async getUserAssignments(tenantId: string): Promise<ApiResponse<Assignment[]>> {
    return api.get(`/tenants/${tenantId}/assignments`)
  },

  // Get a specific assignment
  async getAssignment(tenantId: string, assignmentId: string): Promise<ApiResponse<Assignment>> {
    return api.get(`/tenants/${tenantId}/assignments/${assignmentId}`)
  },

  // Submit an assignment
  async submitAssignment(
    tenantId: string,
    assignmentId: string,
    request: SubmitAssignmentRequest
  ): Promise<ApiResponse<Submission>> {
    return api.post(`/tenants/${tenantId}/assignments/${assignmentId}/submit`, request)
  },

  // Review a submission (for parents/admins)
  async reviewSubmission(
    tenantId: string,
    submissionId: string,
    request: ReviewSubmissionRequest
  ): Promise<ApiResponse<Submission>> {
    return api.put(`/tenants/${tenantId}/assignments/submissions/${submissionId}/review`, request)
  },

  // Get pending submissions for review
  async getPendingSubmissions(tenantId: string): Promise<ApiResponse<Submission[]>> {
    return api.get(`/tenants/${tenantId}/assignments/submissions/pending`)
  },
}

export type {
  Assignment,
  AssignmentSubmission,
  Submission,
  SubmitAssignmentRequest,
  ReviewSubmissionRequest,
}
