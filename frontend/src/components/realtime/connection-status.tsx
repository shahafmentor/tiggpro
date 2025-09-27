'use client'

import { Badge } from '@/components/ui/badge'
import { useRealtimeStore } from '@/lib/stores/realtime-store'

export function RealtimeConnectionStatus() {
  const isConnected = useRealtimeStore(state => state.isConnected)
  const isConnecting = useRealtimeStore(state => state.isConnecting)
  const error = useRealtimeStore(state => state.error)

  if (error) {
    return (
      <Badge variant="destructive" className="text-xs">
        Real-time: Error
      </Badge>
    )
  }

  if (isConnecting) {
    return (
      <Badge variant="secondary" className="text-xs">
        Real-time: Connecting...
      </Badge>
    )
  }

  if (isConnected) {
    return (
      <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
        Real-time: Connected
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-xs">
      Real-time: Disconnected
    </Badge>
  )
}

export function RealtimeNotificationBadge() {
  const unreadCount = useRealtimeStore(state => state.unreadCount)

  if (unreadCount === 0) {
    return null
  }

  return (
    <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full">
      {unreadCount > 9 ? '9+' : unreadCount}
    </Badge>
  )
}