'use client'

import { useEffect } from 'react'
import { useRealtimeConnection } from '@/hooks/use-realtime'
import { useTenant } from '@/lib/contexts/tenant-context'
import { useSession } from 'next-auth/react'

interface RealtimePageWrapperProps {
    children: React.ReactNode
}

/**
 * Wrapper component that ensures realtime functionality is active on pages
 * This ensures:
 * 1. WebSocket connection is established
 * 2. UI automatically updates when realtime events occur
 *
 * Note: Notifications are handled by RealtimeProvider to avoid duplicates
 */
export function RealtimePageWrapper({ children }: RealtimePageWrapperProps) {
    const { currentTenant } = useTenant()
    const { data: session } = useSession()

    // Ensure realtime connection is active
    useRealtimeConnection()

  // Ensure realtime functionality is active for this page
  useEffect(() => {
    // Realtime functionality is now active
  }, [session, currentTenant])

    return <>{children}</>
}
