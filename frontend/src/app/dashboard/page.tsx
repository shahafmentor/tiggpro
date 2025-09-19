'use client'

import { useSession } from 'next-auth/react'
import {
  Calendar,
  CheckSquare,
  Clock,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
      { name: 'Emma', points: 145, avatar: '/avatars/emma.jpg', rank: 1 },
      { name: 'You', points: 127, avatar: session?.user?.image, rank: 2 },
      { name: 'Dad', points: 89, avatar: '/avatars/dad.jpg', rank: 3 },
    ],
  }

  const levelProgress = (mockData.stats.totalPoints / mockData.stats.nextLevelPoints) * 100

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Champion'}! 🎉
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your family today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Points */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Zap className="h-4 w-4 text-points-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-points-primary">
              {mockData.stats.totalPoints}
            </div>
            <p className="text-xs text-muted-foreground">
              +{mockData.stats.totalPoints - 100} from last week
            </p>
          </CardContent>
        </Card>

        {/* Current Level */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Star className="h-4 w-4 text-achievement-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-achievement-gold">
              Level {mockData.stats.currentLevel}
            </div>
            <div className="mt-2 space-y-1">
              <Progress value={levelProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {mockData.stats.nextLevelPoints - mockData.stats.totalPoints} points to Level {mockData.stats.currentLevel + 1}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Completed Chores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-chore-completed" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chore-completed">
              {mockData.stats.completedChores}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockData.stats.pendingChores} pending chores
            </p>
          </CardContent>
        </Card>

        {/* Gaming Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gaming Time</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {mockData.stats.gamingTimeEarned}m
            </div>
            <p className="text-xs text-muted-foreground">
              {mockData.stats.streakDays} day streak! 🔥
            </p>
          </CardContent>
        </Card>
      </div>

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockData.leaderboard.map((member) => (
              <div key={member.rank} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Badge variant={member.rank === 1 ? "default" : "outline"} className="w-6 h-6 p-0 flex items-center justify-center">
                    {member.rank}
                  </Badge>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar || undefined} alt={member.name} />
                  <AvatarFallback>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.points} points
                  </p>
                </div>
                {member.rank === 1 && (
                  <Trophy className="h-4 w-4 text-achievement-gold" />
                )}
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              View Full Leaderboard
            </Button>
          </CardContent>
        </Card>
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
