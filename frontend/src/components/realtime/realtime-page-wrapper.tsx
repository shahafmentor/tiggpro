'use client'

import type { ReactNode } from 'react'

interface RealtimePageWrapperProps {
    children: ReactNode
}

/**
 * Wrapper component that ensures realtime functionality is active on pages
 * This ensures:
 * 1. The page is rendered within the global RealtimeProvider
 * 2. UI automatically updates when realtime events occur
 *
 * Note:
 * - Connection + notifications are owned by the global RealtimeProvider.
 * - This wrapper is intentionally a no-op to avoid duplicate connect/disconnect
 *   cycles that can silently tear down the singleton socket.
 */
export function RealtimePageWrapper({ children }: RealtimePageWrapperProps) {
    return <>{children}</>
}
