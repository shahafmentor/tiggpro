'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import {
  // MVP: Comment out unused imports
  // Calendar,
  CheckSquare,
  // Star,
  // TrendingUp,
  // Trophy,
  // Users,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
// MVP: Comment out unused gamification components
// import { PointsDisplay } from '@/components/gamification/points-display'
// import { FamilyLeaderboard } from '@/components/gamification/family-leaderboard'
import { SubmitAssignmentModal } from '@/components/chores/submit-assignment-modal'
import { useTenant } from '@/lib/contexts/tenant-context'
import { assignmentsApi, type Assignment } from '@/lib/api/assignments'
// import type { LeaderboardEntry } from '@/lib/api/gamification'

export default function DashboardPage() {
  const { data: session } = useSession()
  const { currentTenant } = useTenant()
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null)

  // Fetch user assignments
  const { data: assignmentsResponse, isLoading: assignmentsLoading, error: assignmentsError } = useQuery({
    queryKey: ['user-assignments', currentTenant?.tenant?.id, session?.user?.id],
    queryFn: async () => {
      if (!currentTenant?.tenant?.id) {
        return { success: false, data: [], error: 'No tenant selected' }
      }
      return assignmentsApi.getUserAssignments(currentTenant.tenant.id)
    },
    enabled: !!currentTenant?.tenant?.id && !!session?.user && !!session?.accessToken,
    staleTime: 30000, // 30 seconds
  })

  const assignments: Assignment[] = (assignmentsResponse?.success ? assignmentsResponse.data : []) || []

  // Calculate assignment stats
  const assignmentStats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    approved: assignments.filter(a => a.status === 'approved').length,
    overdue: assignments.filter(a => {
      const dueDate = new Date(a.dueDate)
      const now = new Date()
      return dueDate < now && a.status === 'pending'
    }).length,
  }

  // MVP: Comment out complex mock data - keep it simple
  // const mockData = {
  //   stats: {
  //     totalPoints: 127,
  //     currentLevel: 5,
  //     nextLevelPoints: 150,
  //     completedChores: assignmentStats.approved,
  //     pendingChores: assignmentStats.pending,
  //     gamingTimeEarned: 45,
  //     streakDays: 7,
  //   },
  //   recentActivity: [
  //     {
  //       id: 1,
  //       type: 'chore_completed',
  //       title: 'Cleaned bedroom',
  //       points: 15,
  //       timestamp: '2 hours ago',
  //       user: 'You',
  //     },
  //     {
  //       id: 2,
  //       type: 'achievement_earned',
  //       title: 'Week Warrior',
  //       description: 'Completed 7 chores this week',
  //       timestamp: '1 day ago',
  //       user: 'Emma',
  //     },
  //     {
  //       id: 3,
  //       type: 'level_up',
  //       title: 'Reached Level 5',
  //       points: 20,
  //       timestamp: '2 days ago',
  //       user: 'You',
  //     },
  //   ],
  //   leaderboard: [
  //     {
  //       rank: 1,
  //       userId: 'user-emma',
  //       displayName: 'Emma',
  //       totalPoints: 145,
  //       level: 6,
  //       currentStreakDays: 12,
  //       longestStreakDays: 15
  //     },
  //     {
  //       rank: 2,
  //       userId: session?.user?.id || 'current-user',
  //       displayName: 'You',
  //       totalPoints: 127,
  //       level: 5,
  //       currentStreakDays: 7,
  //       longestStreakDays: 10
  //     },
  //     {
  //       rank: 3,
  //       userId: 'user-dad',
  //       displayName: 'Dad',
  //       totalPoints: 89,
  //       level: 4,
  //       currentStreakDays: 3,
  //       longestStreakDays: 8
  //     },
  //   ] as LeaderboardEntry[],
  // }


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

      {/* MVP: Comment out complex gamification - keep it simple */}
      {/* <PointsDisplay
        totalPoints={mockData.stats.totalPoints}
        level={mockData.stats.currentLevel}
        currentStreakDays={mockData.stats.streakDays}
        longestStreakDays={mockData.stats.streakDays + 3} // Mock longer streak
        availableGamingMinutes={mockData.stats.gamingTimeEarned}
        animated={true}
      /> */}

      {/* My Assignments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            My Assignments
            {assignmentStats.total > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {assignmentStats.total}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : assignmentsError ? (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load assignments</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckSquare className="h-8 w-8 mx-auto mb-2" />
              <p>No assignments yet</p>
              <p className="text-sm">Check back later for new chores!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 3).map((assignment) => {
                const dueDate = new Date(assignment.dueDate)
                const isOverdue = dueDate < new Date() && assignment.status === 'pending'
                const isDueSoon = dueDate.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 // 24 hours

                return (
                  <div key={assignment.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        assignment.status === 'approved' ? 'bg-chore-completed/10' :
                        assignment.status === 'submitted' ? 'bg-chore-submitted/10' :
                        isOverdue ? 'bg-chore-overdue/10' :
                        'bg-chore-pending/10'
                      }`}>
                        <CheckSquare className={`h-5 w-5 ${
                          assignment.status === 'approved' ? 'text-chore-completed' :
                          assignment.status === 'submitted' ? 'text-chore-submitted' :
                          isOverdue ? 'text-chore-overdue' :
                          'text-chore-pending'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {assignment.chore.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Due {dueDate.toLocaleDateString()}</span>
                        {isDueSoon && !isOverdue && <Badge variant="outline" className="text-xs py-0 px-1">Due Soon</Badge>}
                        {isOverdue && <Badge variant="destructive" className="text-xs py-0 px-1">Overdue</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        +{assignment.chore.pointsReward} pts
                      </Badge>
                      {assignment.status === 'pending' ? (
                        <Button
                          size="sm"
                          className="text-xs h-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSubmittingAssignment(assignment)
                          }}
                        >
                          Submit
                        </Button>
                      ) : (
                        <Badge
                          variant={
                            assignment.status === 'approved' ? 'default' :
                            assignment.status === 'submitted' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {assignment.status === 'approved' ? 'Complete' :
                           assignment.status === 'submitted' ? 'Submitted' :
                           assignment.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
              {assignments.length > 3 && (
                <Button variant="outline" className="w-full mt-4">
                  View All Assignments ({assignments.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MVP: Comment out complex features - keep it simple */}
      {/* <div className="grid gap-6 lg:grid-cols-3">
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

        <FamilyLeaderboard
          entries={mockData.leaderboard}
          currentUserId={session?.user?.id || 'current-user'}
          maxDisplayCount={5}
          onViewAll={() => {
            console.log('Navigate to full leaderboard')
          }}
          variant="compact"
        />
      </div>

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
      </Card> */}

      {/* Submit Assignment Modal */}
      <SubmitAssignmentModal
        assignment={submittingAssignment}
        open={!!submittingAssignment}
        onOpenChange={(open) => {
          if (!open) setSubmittingAssignment(null)
        }}
      />
    </div>
  )
}
