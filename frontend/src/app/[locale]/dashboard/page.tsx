'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery as useRewardsQuery } from '@tanstack/react-query'
import {
  // MVP: Comment out unused imports
  // Calendar,
  CheckSquare,
  Star,
  // TrendingUp,
  // Trophy,
  // Users,
  Clock,
  AlertCircle,
  Eye,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, CountBadge, PointsBadge, DueDateBadge } from '@/components/ui/semantic-badges'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
// MVP: Comment out unused gamification components
// import { PointsDisplay } from '@/components/gamification/points-display'
// import { FamilyLeaderboard } from '@/components/gamification/family-leaderboard'
import { SubmitAssignmentModal } from '@/components/chores/submit-assignment-modal'
import { RewardRedemptionModal } from '@/components/gamification/reward-redemption-modal'
import { rewardsApi } from '@/lib/api/rewards'
import { gamificationApi } from '@/lib/api/gamification'
import { useQuery } from '@tanstack/react-query'
import { ChoreDetailModal } from '@/components/chores/chore-detail-modal'
import { useTenant } from '@/lib/contexts/tenant-context'
import { assignmentsApi, type Assignment, type Submission } from '@/lib/api/assignments'
import { TenantMemberRole } from '@tiggpro/shared'
import { useLocalizedRouter } from '@/hooks/use-localized-router'
import { useDashboardTranslations } from '@/hooks/use-translations'
// import type { LeaderboardEntry } from '@/lib/api/gamification'

export default function DashboardPage() {
  const { data: session } = useSession()
  const { currentTenant } = useTenant()
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null)
  const [showAllAssignments, setShowAllAssignments] = useState(false)
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null)
  const [requestRewardOpen, setRequestRewardOpen] = useState(false)

  // User Stats (points balance)
  const { data: userStatsResponse } = useQuery({
    queryKey: ['user-stats', currentTenant?.tenant?.id],
    queryFn: () => currentTenant ? gamificationApi.getUserStats(currentTenant.tenant.id) : Promise.resolve({ success: false } as any),
    enabled: !!currentTenant && !!session,
  })

  // My Rewards (recent)
  const { data: myRewardsResponse } = useRewardsQuery({
    queryKey: ['rewards-redemptions', currentTenant?.tenant?.id],
    queryFn: () => currentTenant ? rewardsApi.listRedemptions(currentTenant.tenant.id) : Promise.resolve({ success: false } as any),
    enabled: !!currentTenant && !!session,
    refetchInterval: 30000,
  })
  const myRewards = (myRewardsResponse?.success ? myRewardsResponse.data : [])?.slice(0, 3) || []
  const router = useLocalizedRouter()
  const t = useDashboardTranslations()

  // Check if user can review submissions
  const canReview = currentTenant?.role === TenantMemberRole.ADMIN ||
                   currentTenant?.role === TenantMemberRole.PARENT

  // Check if user is a child (for chore detail modal)
  const isChild = currentTenant?.role === TenantMemberRole.CHILD

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

  // Fetch pending submissions for review (only for parents/admins)
  const { data: pendingSubmissionsResponse } = useQuery({
    queryKey: ['pending-submissions-dashboard', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? assignmentsApi.getPendingSubmissions(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session && canReview,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const pendingSubmissions: Submission[] = pendingSubmissionsResponse?.success ?
    (pendingSubmissionsResponse.data || []) : []

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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          {t('welcome').replace('{name}', session?.user?.name?.split(' ')[0] || 'Champion')}
        </h1>
        <p className="text-muted-foreground">
          {t('whatsHappening')}
        </p>
      </div>

      {/* Pending Reviews Section - Only for Parents/Admins */}
      {canReview && pendingSubmissions.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertCircle className="h-5 w-5" />
              {t('pendingReviews')}
              <Badge variant="destructive" className="ml-auto">
                {pendingSubmissions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {t('youHaveSubmissions').replace('{count}', String(pendingSubmissions.length))}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push('/dashboard/review')}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('reviewSubmissions')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/review')}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                >
                  {t('viewAll')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MVP: Comment out complex gamification - keep it simple */}
      {/* <PointsDisplay
        totalPoints={mockData.stats.totalPoints}
        level={mockData.stats.currentLevel}
        currentStreakDays={mockData.stats.streakDays}
        longestStreakDays={mockData.stats.streakDays + 3} // Mock longer streak
        availableGamingMinutes={mockData.stats.gamingTimeEarned}
        animated={true}
      /> */}

      {/* Points Balance for Kids */}
      {isChild && userStatsResponse?.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              My Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(userStatsResponse as any).data?.availablePoints || 0}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(userStatsResponse as any).data?.totalPoints || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions for Kids */}
      {isChild && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button onClick={() => setRequestRewardOpen(true)}>
                Request Reward
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/rewards')}>
                View My Rewards
              </Button>
            </div>
            {myRewards.length > 0 && (
              <div className="space-y-2">
                {myRewards.map((r: any) => (
                  <div key={r.id} className="text-sm flex items-center justify-between p-2 rounded border">
                    <span className="capitalize">{String(r.type).replace('_',' ')}</span>
                    <span className="text-muted-foreground">
                      <StatusBadge status={r.status as any} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Assignments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {t('myAssignments')}
            {assignmentStats.total > 0 && (
              <CountBadge count={assignmentStats.total} className="ml-auto" />
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
              <p>{t('failedToLoadAssignments')}</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckSquare className="h-8 w-8 mx-auto mb-2" />
              <p>{t('noAssignments')}</p>
              <p className="text-sm">{t('checkBackLater')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(showAllAssignments ? assignments : assignments.slice(0, 3)).map((assignment) => {
                const dueDate = new Date(assignment.dueDate)
                const isOverdue = dueDate < new Date() && assignment.status === 'pending'

                return (
                  <div
                    key={assignment.id}
                    className={`flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                      isChild ? 'cursor-pointer' : ''
                    }`}
                    onClick={isChild ? () => setViewingAssignment(assignment) : undefined}
                  >
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
                        <span>{t('due').replace('{date}', dueDate.toLocaleDateString())}</span>
                        <DueDateBadge dueDate={dueDate} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PointsBadge points={assignment.chore.pointsReward} />
                      {assignment.status === 'pending' ? (
                        <Button
                          size="sm"
                          className="text-xs h-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSubmittingAssignment(assignment)
                          }}
                        >
                          {t('submit')}
                        </Button>
                      ) : assignment.status === 'rejected' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSubmittingAssignment(assignment)
                          }}
                        >
                          {t('resubmit')}
                        </Button>
                      ) : (
                        <StatusBadge status={assignment.status as 'pending' | 'submitted' | 'approved' | 'completed' | 'rejected' | 'overdue'} />
                      )}
                    </div>
                  </div>
                )
              })}
              {assignments.length > 3 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowAllAssignments(!showAllAssignments)}
                >
                  {showAllAssignments ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      {t('showLess')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      {t('viewAllAssignments').replace('{count}', String(assignments.length))}
                    </>
                  )}
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

      {/* Chore Detail Modal for Kids */}
      <ChoreDetailModal
        assignment={viewingAssignment}
        open={!!viewingAssignment}
        onOpenChange={(open) => {
          if (!open) setViewingAssignment(null)
        }}
        canSubmit={isChild}
        onSubmit={(assignment) => {
          setViewingAssignment(null)
          setSubmittingAssignment(assignment)
        }}
      />

      {/* Reward Redemption Modal */}
      <RewardRedemptionModal open={requestRewardOpen} onOpenChange={setRequestRewardOpen} />
    </div>
  )
}
