'use client'

import { useSession } from 'next-auth/react'
import {
  Calendar,
  CheckSquare,
  Star,
  TrendingUp,
  Trophy,
  Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PointsDisplay } from '@/components/gamification/points-display'
import { FamilyLeaderboard } from '@/components/gamification/family-leaderboard'
import type { LeaderboardEntry } from '@/lib/api/gamification'

export default function DashboardPage() {
  const { data: session } = useSession()

  // TODO: Replace with real data from API
  const mockData = {
    stats: {
      totalPoints: 127,
      currentLevel: 5,
      nextLevelPoints: 150,
      completedChores: 8,
      pendingChores: 3,
      gamingTimeEarned: 45, // minutes
      streakDays: 7,
    },
    recentActivity: [
      {
        id: 1,
        type: 'chore_completed',
        title: 'Cleaned bedroom',
        points: 15,
        timestamp: '2 hours ago',
        user: 'You',
      },
      {
        id: 2,
        type: 'achievement_earned',
        title: 'Week Warrior',
        description: 'Completed 7 chores this week',
        timestamp: '1 day ago',
        user: 'Emma',
      },
      {
        id: 3,
        type: 'level_up',
        title: 'Reached Level 5',
        points: 20,
        timestamp: '2 days ago',
        user: 'You',
      },
    ],
    leaderboard: [
      {
        rank: 1,
        userId: 'user-emma',
        displayName: 'Emma',
        totalPoints: 145,
        level: 6,
        currentStreakDays: 12,
        longestStreakDays: 15
      },
      {
        rank: 2,
        userId: session?.user?.id || 'current-user',
        displayName: 'You',
        totalPoints: 127,
        level: 5,
        currentStreakDays: 7,
        longestStreakDays: 10
      },
      {
        rank: 3,
        userId: 'user-dad',
        displayName: 'Dad',
        totalPoints: 89,
        level: 4,
        currentStreakDays: 3,
        longestStreakDays: 8
      },
    ] as LeaderboardEntry[],
  }


  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Champion'}! 🎉
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening in your family today
        </p>
      </div>

      {/* Gamification Stats */}
      <PointsDisplay
        totalPoints={mockData.stats.totalPoints}
        level={mockData.stats.currentLevel}
        currentStreakDays={mockData.stats.streakDays}
        longestStreakDays={mockData.stats.streakDays + 3} // Mock longer streak
        availableGamingMinutes={mockData.stats.gamingTimeEarned}
        animated={true}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {activity.type === 'chore_completed' && (
                    <div className="w-8 h-8 bg-chore-completed/10 rounded-full flex items-center justify-center">
                      <CheckSquare className="h-4 w-4 text-chore-completed" />
                    </div>
                  )}
                  {activity.type === 'achievement_earned' && (
                    <div className="w-8 h-8 bg-achievement-gold/10 rounded-full flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-achievement-gold" />
                    </div>
                  )}
                  {activity.type === 'level_up' && (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
                {activity.points && (
                  <Badge variant="secondary" className="bg-points-primary/10 text-points-primary">
                    +{activity.points} pts
                  </Badge>
                )}
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Family Leaderboard */}
        <FamilyLeaderboard
          entries={mockData.leaderboard}
          currentUserId={session?.user?.id || 'current-user'}
          maxDisplayCount={5}
          onViewAll={() => {
            // TODO: Navigate to full leaderboard page
            console.log('Navigate to full leaderboard')
          }}
          variant="compact"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-20 flex-col gap-2" variant="outline">
              <CheckSquare className="h-6 w-6" />
              <span>Complete Chore</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Calendar className="h-6 w-6" />
              <span>Schedule Chore</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Users className="h-6 w-6" />
              <span>Invite Family</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Trophy className="h-6 w-6" />
              <span>View Rewards</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
