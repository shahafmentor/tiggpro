import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Data is kept in cache for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) {
          return false
        }
        // Don't retry more than 3 times
        return failureCount < 3
      },

      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,

      // Refetch when reconnecting to the internet
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations on network errors only
      retry: (failureCount, error) => {
        // Only retry network errors, not user errors
        if (error instanceof Error && error.message.includes('network')) {
          return failureCount < 2
        }
        return false
      },
    },
  },
})

// Query key factory for consistent key management
export const queryKeys = {
  // Auth queries
  auth: {
    profile: ['auth', 'profile'] as const,
    session: ['auth', 'session'] as const,
  },

  // Tenant queries
  tenants: {
    all: ['tenants'] as const,
    my: ['tenants', 'my'] as const,
    detail: (id: string) => ['tenants', 'detail', id] as const,
    members: (id: string) => ['tenants', 'members', id] as const,
  },

  // Chore queries
  chores: {
    all: ['chores'] as const,
    byTenant: (tenantId: string) => ['chores', 'tenant', tenantId] as const,
    detail: (id: string) => ['chores', 'detail', id] as const,
    assignments: (tenantId: string, userId?: string) =>
      ['chores', 'assignments', tenantId, ...(userId ? [userId] : [])] as const,
  },

  // Assignment queries
  assignments: {
    all: ['assignments'] as const,
    byTenant: (tenantId: string) => ['assignments', 'tenant', tenantId] as const,
    detail: (id: string) => ['assignments', 'detail', id] as const,
    submissions: {
      pending: (tenantId: string) => ['assignments', 'submissions', 'pending', tenantId] as const,
      byAssignment: (assignmentId: string) => ['assignments', 'submissions', assignmentId] as const,
    },
  },

  // Gamification queries
  gamification: {
    stats: (tenantId: string, userId?: string) =>
      ['gamification', 'stats', tenantId, ...(userId ? [userId] : [])] as const,
    leaderboard: (tenantId: string) => ['gamification', 'leaderboard', tenantId] as const,
    achievements: {
      available: (tenantId: string) => ['gamification', 'achievements', 'available', tenantId] as const,
      earned: (tenantId: string, userId?: string) =>
        ['gamification', 'achievements', 'earned', tenantId, ...(userId ? [userId] : [])] as const,
    },
  },
} as const
