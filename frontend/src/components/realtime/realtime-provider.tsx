'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRealtimeConnection, useRealtimeNotifications } from '@/hooks/use-realtime'

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { data: session, status } = useSession()
  const { isConnected, isConnecting, error } = useRealtimeConnection()

  // Initialize realtime notifications (this sets up the event handlers)
  useRealtimeNotifications()

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      // User authenticated, real-time connection initialized
    } else if (status === 'unauthenticated') {
      // User not authenticated, real-time connection will be skipped
    }
  }, [status, session])

  // Monitor connection status
  useEffect(() => {
    if (status === 'authenticated') {
      // Realtime connection is active
    }
  }, [isConnected, isConnecting, error, status])

  return <>{children}</>
}