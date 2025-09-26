'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery as useRewardsQuery } from '@tanstack/react-query'
import {
  // MVP: Comment out unused imports
  // Calendar,
  Star,
  // TrendingUp,
  // Trophy,
  // Users,
  AlertCircle,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
// MVP: Comment out unused gamification components
// import { PointsDisplay } from '@/components/gamification/points-display'
// import { FamilyLeaderboard } from '@/components/gamification/family-leaderboard'
import { SubmitAssignmentModal } from '@/components/chores/submit-assignment-modal'
import { RewardRedemptionModal } from '@/components/gamification/reward-redemption-modal'
import { RewardsSection } from '@/components/dashboard/rewards-section'
import { AssignmentsSection } from '@/components/dashboard/assignments-section'
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

      {/* Rewards Section for Kids */}
      {isChild && (
        <RewardsSection
          rewards={myRewards}
          isLoading={false}
          error={null}
          onRequestReward={() => setRequestRewardOpen(true)}
        />
      )}

      {/* My Assignments Section */}
      <AssignmentsSection
        assignments={assignments}
        isLoading={assignmentsLoading}
        error={assignmentsError?.message || null}
        isChild={isChild}
        onViewAssignment={setViewingAssignment}
        onSubmitAssignment={setSubmittingAssignment}
      />

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
