import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { io, Socket } from 'socket.io-client'
import { getSession } from 'next-auth/react'

export interface RealtimeEvent {
  type: string
  data: unknown
  timestamp: string
}

export interface ChoreAssignedEvent {
  assignmentId: string
  choreId: string
  choreTitle: string
  assignedTo: {
    id: string
    displayName: string
    email: string
  }
  assignedBy: {
    id: string
    displayName: string
    email: string
  }
  dueDate: string
  priority: string
  pointsReward: number
}

export interface AssignmentSubmittedEvent {
  submissionId: string
  assignmentId: string
  choreTitle: string
  submittedBy: {
    id: string
    displayName: string
    email: string
  }
  submissionNotes?: string
  mediaUrls?: string[]
}

export interface AssignmentReviewedEvent {
  submissionId: string
  assignmentId: string
  choreTitle: string
  reviewStatus: 'approved' | 'rejected'
  reviewFeedback?: string
  pointsAwarded?: number
  reviewedBy: {
    id: string
    displayName: string
    email: string
  }
  submittedBy: {
    id: string
    displayName: string
    email: string
  }
}

export interface RewardRequestedEvent {
  redemptionId: string
  rewardType: string
  rewardAmount?: number
  pointsCost: number
  requestedBy: {
    id: string
    displayName: string
    email: string
  }
  description?: string
}

export interface RewardReviewedEvent {
  redemptionId: string
  rewardType: string
  reviewStatus: 'approved' | 'rejected'
  reviewFeedback?: string
  reviewedBy: {
    id: string
    displayName: string
    email: string
  }
  requestedBy: {
    id: string
    displayName: string
    email: string
  }
}

interface RealtimeState {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  socket: Socket | null
  error: string | null

  // Event history
  events: RealtimeEvent[]

  // Unread notifications
  unreadCount: number

  // Actions
  connect: () => Promise<void>
  disconnect: () => void
  clearEvents: () => void
  markAsRead: () => void

  // Event handlers
  onChoreAssigned: (callback: (event: ChoreAssignedEvent) => void) => () => void
  onAssignmentSubmitted: (callback: (event: AssignmentSubmittedEvent) => void) => () => void
  onAssignmentReviewed: (callback: (event: AssignmentReviewedEvent) => void) => () => void
  onRewardRequested: (callback: (event: RewardRequestedEvent) => void) => () => void
  onRewardReviewed: (callback: (event: RewardReviewedEvent) => void) => () => void
}

export const useRealtimeStore = create<RealtimeState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    isConnecting: false,
    socket: null,
    error: null,
    events: [],
    unreadCount: 0,

    // Connect to WebSocket
    connect: async () => {
      const state = get()
      if (state.isConnected || state.isConnecting) {
        return
      }

      set({ isConnecting: true, error: null })

      try {
        const session = await getSession()
        if (!session?.accessToken) {
          throw new Error('No access token available')
        }

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const socket = io(`${backendUrl}/realtime`, {
          auth: {
            token: session.accessToken
          },
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        })

        // Connection event handlers
        socket.on('connect', () => {
          console.log('Connected to real-time server')
          set({ isConnected: true, isConnecting: false, error: null })
        })

        socket.on('disconnect', (reason) => {
          console.log('Disconnected from real-time server:', reason)
          set({ isConnected: false, isConnecting: false })
        })

        socket.on('connect_error', (error) => {
          console.error('Real-time connection error:', error)
          set({
            isConnected: false,
            isConnecting: false,
            error: error.message || 'Connection failed'
          })
        })

        socket.on('connection:success', (data) => {
          console.log('Real-time connection established:', data)
        })

        // Real-time event handler
        socket.on('realtime:event', (event: RealtimeEvent) => {
          console.log('Received real-time event:', event)
          set(state => ({
            events: [event, ...state.events].slice(0, 100), // Keep last 100 events
            unreadCount: state.unreadCount + 1
          }))
        })

        set({ socket })
      } catch (error) {
        console.error('Failed to connect to real-time server:', error)
        set({
          isConnecting: false,
          error: error instanceof Error ? error.message : 'Failed to connect'
        })
      }
    },

    // Disconnect from WebSocket
    disconnect: () => {
      const { socket } = get()
      if (socket) {
        socket.disconnect()
        set({ socket: null, isConnected: false, isConnecting: false })
      }
    },

    // Clear event history
    clearEvents: () => {
      set({ events: [] })
    },

    // Mark notifications as read
    markAsRead: () => {
      set({ unreadCount: 0 })
    },

    // Event subscription helpers
    onChoreAssigned: (callback: (event: ChoreAssignedEvent) => void): (() => void) => {
      const unsubscribe = useRealtimeStore.subscribe(
        (state: RealtimeState) => state.events,
        (events: RealtimeEvent[]) => {
          const latestEvent = events[0]
          if (latestEvent?.type === 'chore_assigned') {
            callback(latestEvent.data as ChoreAssignedEvent)
          }
        }
      )
      return unsubscribe
    },

    onAssignmentSubmitted: (callback: (event: AssignmentSubmittedEvent) => void): (() => void) => {
      const unsubscribe = useRealtimeStore.subscribe(
        (state: RealtimeState) => state.events,
        (events: RealtimeEvent[]) => {
          const latestEvent = events[0]
          if (latestEvent?.type === 'assignment_submitted') {
            callback(latestEvent.data as AssignmentSubmittedEvent)
          }
        }
      )
      return unsubscribe
    },

    onAssignmentReviewed: (callback: (event: AssignmentReviewedEvent) => void): (() => void) => {
      const unsubscribe = useRealtimeStore.subscribe(
        (state: RealtimeState) => state.events,
        (events: RealtimeEvent[]) => {
          const latestEvent = events[0]
          if (latestEvent?.type === 'assignment_reviewed') {
            callback(latestEvent.data as AssignmentReviewedEvent)
          }
        }
      )
      return unsubscribe
    },

    onRewardRequested: (callback: (event: RewardRequestedEvent) => void): (() => void) => {
      const unsubscribe = useRealtimeStore.subscribe(
        (state: RealtimeState) => state.events,
        (events: RealtimeEvent[]) => {
          const latestEvent = events[0]
          if (latestEvent?.type === 'reward_requested') {
            callback(latestEvent.data as RewardRequestedEvent)
          }
        }
      )
      return unsubscribe
    },

    onRewardReviewed: (callback: (event: RewardReviewedEvent) => void): (() => void) => {
      const unsubscribe = useRealtimeStore.subscribe(
        (state: RealtimeState) => state.events,
        (events: RealtimeEvent[]) => {
          const latestEvent = events[0]
          if (latestEvent?.type === 'reward_reviewed') {
            callback(latestEvent.data as RewardReviewedEvent)
          }
        }
      )
      return unsubscribe
    },
  }))
)

// Selectors for common state combinations
export const useRealtimeConnection = () => useRealtimeStore((state: RealtimeState) => ({
  isConnected: state.isConnected,
  isConnecting: state.isConnecting,
  error: state.error,
  connect: state.connect,
  disconnect: state.disconnect,
}))

export const useRealtimeEvents = () => useRealtimeStore((state: RealtimeState) => ({
  events: state.events,
  unreadCount: state.unreadCount,
  clearEvents: state.clearEvents,
  markAsRead: state.markAsRead,
}))

export const useRealtimeNotifications = () => useRealtimeStore((state: RealtimeState) => ({
  unreadCount: state.unreadCount,
  markAsRead: state.markAsRead,
}))