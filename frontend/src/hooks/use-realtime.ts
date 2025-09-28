import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import {
  useRealtimeStore,
  type ChoreAssignedEvent,
  type AssignmentSubmittedEvent,
  type AssignmentReviewedEvent,
  type RewardRequestedEvent,
  type RewardReviewedEvent,
} from '@/lib/stores/realtime-store'
import { useTenant } from '@/lib/contexts/tenant-context'
import { useRealtimeTranslations } from '@/hooks/use-translations'

export function useRealtimeConnection() {
  const { data: session, status } = useSession()
  const isConnected = useRealtimeStore(state => state.isConnected)
  const isConnecting = useRealtimeStore(state => state.isConnecting)
  const error = useRealtimeStore(state => state.error)
  const connect = useRealtimeStore(state => state.connect)
  const disconnect = useRealtimeStore(state => state.disconnect)

  useEffect(() => {
    // Only connect if user is authenticated and has an access token
    if (status === 'authenticated' && session?.accessToken) {
      connect()
    } else if (status === 'unauthenticated') {
      // Disconnect if user becomes unauthenticated
      disconnect()
    }

    return () => disconnect()
  }, [connect, disconnect, status, session?.accessToken])

  return { isConnected, isConnecting, error }
}

export function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const { currentTenant } = useTenant()
  const { data: session } = useSession()
  const t = useRealtimeTranslations()
  const isSetupRef = useRef(false)

  const handleChoreAssigned = useCallback(
    (event: ChoreAssignedEvent) => {
      // Only show notification to the assigned child
      if (event.assignedTo.id === session?.user?.id) {
        toast.success(t('choreAssigned', { choreTitle: event.choreTitle }), {
          description: t('choreAssignedDescription', { assignedBy: event.assignedBy.displayName }),
          duration: 5000,
        })
      }

      // Invalidate relevant queries for all users
      if (currentTenant) {
        queryClient.invalidateQueries({
          queryKey: ['assignments', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['user-assignments', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['chores', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['user-stats', currentTenant.tenant.id],
        })
      }
    },
    [queryClient, currentTenant, session, t]
  )

  const handleAssignmentSubmitted = useCallback(
    (event: AssignmentSubmittedEvent) => {
      // Show notification to parents/admins (not the submitter)
      if (event.submittedBy.id !== session?.user?.id) {
        toast.info(t('assignmentSubmitted', { choreTitle: event.choreTitle }), {
          description: t('assignmentSubmittedDescription', { submittedBy: event.submittedBy.displayName }),
          duration: 5000,
        })
      }

      // Invalidate relevant queries for all users
      if (currentTenant) {
        queryClient.invalidateQueries({
          queryKey: ['assignments', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['user-assignments', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['submissions', 'pending', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['pending-submissions-count', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['pending-submissions-dashboard', currentTenant.tenant.id],
        })
      }
    },
    [queryClient, currentTenant, session, t]
  )

  const handleAssignmentReviewed = useCallback(
    (event: AssignmentReviewedEvent) => {
      // Only show notification to the child who submitted (not the reviewer)
      if (event.submittedBy.id === session?.user?.id) {
        const isApproved = event.reviewStatus === 'approved'
        const toastFn = isApproved ? toast.success : toast.error

        if (isApproved) {
          toastFn(t('assignmentApproved', { choreTitle: event.choreTitle }), {
            description: t('assignmentApprovedDescription', { pointsAwarded: event.pointsAwarded }),
            duration: 5000,
          })
        } else {
          toastFn(t('assignmentRejected', { choreTitle: event.choreTitle }), {
            description: t('assignmentRejectedDescription', { reviewFeedback: event.reviewFeedback || 'Please try again' }),
            duration: 5000,
          })
        }
      }

      // Invalidate relevant queries for all users
      if (currentTenant) {
        queryClient.invalidateQueries({
          queryKey: ['assignments', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['user-assignments', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['submissions', 'pending', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['pending-submissions-count', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['pending-submissions-dashboard', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['user-stats', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['points', currentTenant.tenant.id],
        })
      }
    },
    [queryClient, currentTenant, session, t]
  )

  const handleRewardRequested = useCallback(
    (event: RewardRequestedEvent) => {
      // Show notification to parents/admins (not the requester)
      if (event.requestedBy.id !== session?.user?.id) {
        toast.info(t('rewardRequested', { rewardType: event.rewardType }), {
          description: t('rewardRequestedDescription', {
            pointsCost: event.pointsCost,
            requestedBy: event.requestedBy.displayName
          }),
          duration: 5000,
        })
      }

      // Invalidate relevant queries for all users
      if (currentTenant) {
        queryClient.invalidateQueries({
          queryKey: ['rewards', 'redemptions', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['rewards-redemptions', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['rewards', 'pending', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['pending-redemptions-dashboard', currentTenant.tenant.id],
        })
      }
    },
    [queryClient, currentTenant, session, t]
  )

  const handleRewardReviewed = useCallback(
    (event: RewardReviewedEvent) => {
      // Only show notification to the child who requested (not the reviewer)
      if (event.requestedBy.id === session?.user?.id) {
        const isApproved = event.reviewStatus === 'approved'
        const toastFn = isApproved ? toast.success : toast.error

        if (isApproved) {
          toastFn(t('rewardApproved', { rewardType: event.rewardType }), {
            description: t('rewardApprovedDescription', { reviewedBy: event.reviewedBy.displayName }),
            duration: 5000,
          })
        } else {
          toastFn(t('rewardRejected', { rewardType: event.rewardType }), {
            description: t('rewardRejectedDescription', { reviewFeedback: event.reviewFeedback || 'Request was declined' }),
            duration: 5000,
          })
        }
      }

      // Invalidate relevant queries for all users
      if (currentTenant) {
        queryClient.invalidateQueries({
          queryKey: ['rewards', 'redemptions', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['rewards-redemptions', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['rewards', 'pending', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['pending-redemptions-dashboard', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['user-stats', currentTenant.tenant.id],
        })
        queryClient.invalidateQueries({
          queryKey: ['points', currentTenant.tenant.id],
        })
      }
    },
    [queryClient, currentTenant, session, t]
  )

  useEffect(() => {
    // Prevent duplicate setup
    if (isSetupRef.current) {
      return
    }
    isSetupRef.current = true

    const store = useRealtimeStore.getState()

    // Subscribe to all event types
    const unsubscribeChoreAssigned = store.onChoreAssigned(handleChoreAssigned)
    const unsubscribeAssignmentSubmitted = store.onAssignmentSubmitted(handleAssignmentSubmitted)
    const unsubscribeAssignmentReviewed = store.onAssignmentReviewed(handleAssignmentReviewed)
    const unsubscribeRewardRequested = store.onRewardRequested(handleRewardRequested)
    const unsubscribeRewardReviewed = store.onRewardReviewed(handleRewardReviewed)

    return () => {
      isSetupRef.current = false
      unsubscribeChoreAssigned()
      unsubscribeAssignmentSubmitted()
      unsubscribeAssignmentReviewed()
      unsubscribeRewardRequested()
      unsubscribeRewardReviewed()
    }
  }, [
    handleChoreAssigned,
    handleAssignmentSubmitted,
    handleAssignmentReviewed,
    handleRewardRequested,
    handleRewardReviewed,
  ])
}

// Hook for individual event subscriptions
export function useRealtimeEvent<T>(
  eventType: string,
  callback: (data: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const unsubscribe = useRealtimeStore.subscribe(
      (state) => state.events,
      (events) => {
        const latestEvent = events[0]
        if (latestEvent?.type === eventType) {
          callback(latestEvent.data as T)
        }
      }
    )

    return unsubscribe
  }, [eventType, callback, ...deps])
}

// Hook for checking if user should receive real-time notifications
export function useRealtimePermissions() {
  const { currentTenant } = useTenant()

  const canReceiveChoreNotifications = currentTenant?.role === 'child'
  const canReceiveSubmissionNotifications = currentTenant?.role === 'parent' || currentTenant?.role === 'admin'
  const canReceiveRewardNotifications = true // All users can receive reward notifications

  return {
    canReceiveChoreNotifications,
    canReceiveSubmissionNotifications,
    canReceiveRewardNotifications,
  }
}

// Hook for components that need to automatically refresh on realtime events
export function useRealtimeRefresh() {
  const queryClient = useQueryClient()
  const { currentTenant } = useTenant()

  const refreshAssignments = useCallback(() => {
    if (currentTenant) {
      queryClient.invalidateQueries({
        queryKey: ['assignments', currentTenant.tenant.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['user-assignments', currentTenant.tenant.id],
      })
    }
  }, [queryClient, currentTenant])

  const refreshSubmissions = useCallback(() => {
    if (currentTenant) {
      queryClient.invalidateQueries({
        queryKey: ['submissions', 'pending', currentTenant.tenant.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['pending-submissions-count', currentTenant.tenant.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['pending-submissions-dashboard', currentTenant.tenant.id],
      })
    }
  }, [queryClient, currentTenant])

  const refreshRewards = useCallback(() => {
    if (currentTenant) {
      queryClient.invalidateQueries({
        queryKey: ['rewards', 'redemptions', currentTenant.tenant.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['rewards-redemptions', currentTenant.tenant.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['pending-redemptions-dashboard', currentTenant.tenant.id],
      })
    }
  }, [queryClient, currentTenant])

  const refreshUserStats = useCallback(() => {
    if (currentTenant) {
      queryClient.invalidateQueries({
        queryKey: ['user-stats', currentTenant.tenant.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['points', currentTenant.tenant.id],
      })
    }
  }, [queryClient, currentTenant])

  const refreshAll = useCallback(() => {
    refreshAssignments()
    refreshSubmissions()
    refreshRewards()
    refreshUserStats()
  }, [refreshAssignments, refreshSubmissions, refreshRewards, refreshUserStats])

  return {
    refreshAssignments,
    refreshSubmissions,
    refreshRewards,
    refreshUserStats,
    refreshAll,
  }
}