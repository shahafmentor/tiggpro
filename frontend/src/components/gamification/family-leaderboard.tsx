'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Users, Medal, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/api/gamification'

interface FamilyLeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  title?: string
  maxDisplayCount?: number
  showViewAllButton?: boolean
  onViewAll?: () => void
  variant?: 'compact' | 'detailed'
  className?: string
}

interface LeaderboardItemProps {
  entry: LeaderboardEntry
  isCurrentUser?: boolean
  variant?: 'compact' | 'detailed'
}

function LeaderboardItem({ entry, isCurrentUser, variant = 'compact' }: LeaderboardItemProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Medal className="h-4 w-4 text-amber-600" />
      default:
        return null
    }
  }

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default'
    return 'outline'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn(
      "flex items-center space-x-3 py-2",
      isCurrentUser && "bg-primary/5 rounded-lg px-3 -mx-3"
    )}>
      {/* Rank */}
      <div className="flex items-center justify-center min-w-[32px]">
        <Badge
          variant={getRankBadgeVariant(entry.rank)}
          className={cn(
            "w-6 h-6 p-0 flex items-center justify-center text-xs font-bold",
            entry.rank === 1 && "bg-yellow-500 text-yellow-50 hover:bg-yellow-600"
          )}
        >
          {entry.rank}
        </Badge>
      </div>

      {/* Avatar */}
      <Avatar className="h-8 w-8">
        <AvatarImage src={undefined} alt={entry.displayName} />
        <AvatarFallback className="text-xs">
          {getInitials(entry.displayName)}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-medium truncate",
            isCurrentUser && "text-primary"
          )}>
            {entry.displayName}
            {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
          </p>
          {entry.rank <= 3 && getRankIcon(entry.rank)}
        </div>

        {variant === 'detailed' && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span>Level {entry.level}</span>
            <span>•</span>
            <span>{entry.currentStreakDays} day streak</span>
          </div>
        )}
      </div>

      {/* Points */}
      <div className="text-right">
        <p className="text-sm font-bold text-foreground">
          {entry.totalPoints.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">
          points
        </p>
      </div>

      {/* Trophy for first place */}
      {entry.rank === 1 && (
        <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
      )}
    </div>
  )
}

export function FamilyLeaderboard({
  entries,
  currentUserId,
  title = "Family Leaderboard",
  maxDisplayCount = 5,
  showViewAllButton = true,
  onViewAll,
  variant = 'compact',
  className
}: FamilyLeaderboardProps) {
  const displayEntries = maxDisplayCount ? entries.slice(0, maxDisplayCount) : entries
  const hasMoreEntries = entries.length > maxDisplayCount

  if (!entries.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No family members found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Invite family members to see the leaderboard
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {displayEntries.map((entry) => (
          <LeaderboardItem
            key={entry.userId}
            entry={entry}
            isCurrentUser={entry.userId === currentUserId}
            variant={variant}
          />
        ))}

        {showViewAllButton && hasMoreEntries && onViewAll && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={onViewAll}
          >
            View Full Leaderboard
          </Button>
        )}
      </CardContent>
    </Card>
  )
}