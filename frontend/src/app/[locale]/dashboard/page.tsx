'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery as useRewardsQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Eye,
  Filter,
  CheckSquare,
  Gift
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SubmitAssignmentModal } from '@/components/chores/submit-assignment-modal'
import { RewardsStatus } from '@/components/dashboard/rewards-status'
import { AssignmentsSection } from '@/components/dashboard/assignments-section'
import { rewardsApi } from '@/lib/api/rewards'
import { gamificationApi } from '@/lib/api/gamification'
import { useQuery } from '@tanstack/react-query'
import { ChoreDetailModal } from '@/components/chores/chore-detail-modal'
import { useTenant } from '@/lib/contexts/tenant-context'
import { assignmentsApi, type Assignment, type Submission } from '@/lib/api/assignments'
import { TenantMemberRole, type RewardRedemption } from '@tiggpro/shared'
import { useLocalizedRouter } from '@/hooks/use-localized-router'
import { useDashboardTranslations } from '@/hooks/use-translations'
import { RealtimePageWrapper } from '@/components/realtime/realtime-page-wrapper'
import { MyPointsCard } from '@/components/gamification'

export default function DashboardPage() {
  const { data: session } = useSession()
  const { currentTenant } = useTenant()
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null)
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all-except-approved')

  // User Stats (points balance)
  const { data: userStatsResponse } = useQuery({
    queryKey: ['user-stats', currentTenant?.tenant?.id],
    queryFn: () => currentTenant ? gamificationApi.getUserStats(currentTenant.tenant.id) : Promise.resolve(null),
    enabled: !!currentTenant && !!session,
  })

  // My Rewards (all redemptions for the user)
  const { data: myRewardsResponse } = useRewardsQuery({
    queryKey: ['rewards-redemptions', currentTenant?.tenant?.id],
    queryFn: () => currentTenant ? rewardsApi.listRedemptions(currentTenant.tenant.id) : Promise.resolve(null),
    enabled: !!currentTenant && !!session,
    refetchInterval: 30000,
  })
  const myRewards = (myRewardsResponse?.success ? myRewardsResponse.data : []) || []
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

  const allAssignments: Assignment[] = (assignmentsResponse?.success ? assignmentsResponse.data : []) || []

  // Filter assignments based on status filter
  const assignments: Assignment[] = allAssignments.filter(assignment => {
    switch (statusFilter) {
      case 'all':
        return true
      case 'all-except-approved':
        return assignment.status !== 'approved'
      case 'pending':
        return assignment.status === 'pending'
      case 'submitted':
        return assignment.status === 'submitted'
      case 'approved':
        return assignment.status === 'approved'
      case 'rejected':
        return assignment.status === 'rejected'
      default:
        return assignment.status !== 'approved'
    }
  })

  // Fetch pending submissions for review (only for parents/admins)
  const { data: pendingSubmissionsResponse } = useQuery({
    queryKey: ['pending-submissions-dashboard', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? assignmentsApi.getPendingSubmissions(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session && canReview,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const pendingSubmissions: Submission[] = pendingSubmissionsResponse?.success ?
    (pendingSubmissionsResponse.data || []) : []

  // Fetch pending redemptions for review (only for parents/admins)
  const { data: pendingRedemptionsResponse } = useQuery({
    queryKey: ['pending-redemptions-dashboard', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? rewardsApi.getPendingRedemptions(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session && canReview,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const pendingRedemptions: RewardRedemption[] = pendingRedemptionsResponse?.success ?
    (pendingRedemptionsResponse.data || []) : []

  return (
    <RealtimePageWrapper>
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Header */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t('welcome').replace('{name}', session?.user?.name?.split(' ')[0] || 'Champion')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Rewards Section - Only for Parents/Admins */}
        {canReview && pendingRedemptions.length > 0 && (
          <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <Gift className="h-5 w-5" />
                {t('pendingRewards')}
                <Badge variant="destructive" className="ml-auto">
                  {pendingRedemptions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {t('youHaveRewards').replace('{count}', String(pendingRedemptions.length))}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push('/dashboard/rewards')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t('reviewRewards')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Points Balance for Kids */}
        {isChild && userStatsResponse?.success && userStatsResponse.data && (
          <MyPointsCard stats={userStatsResponse.data} />
        )}

        {/* Rewards Status for Kids */}
        {isChild && (
          <RewardsStatus
            rewards={myRewards}
            isLoading={false}
            error={null}
          />
        )}

        {/* My Assignments Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{t('myAssignments')}</span>
                {allAssignments.length > 0 && (
                  <Badge variant="secondary" className="flex-shrink-0">
                    {allAssignments.length}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t('filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    <SelectItem value="all-except-approved">{t('allExceptApproved')}</SelectItem>
                    <SelectItem value="pending">{t('pendingOnly')}</SelectItem>
                    <SelectItem value="submitted">{t('submittedOnly')}</SelectItem>
                    <SelectItem value="approved">{t('approvedOnly')}</SelectItem>
                    <SelectItem value="rejected">{t('rejectedOnly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AssignmentsSection
              assignments={assignments}
              isLoading={assignmentsLoading}
              error={assignmentsError?.message || null}
              isChild={isChild}
              onViewAssignment={setViewingAssignment}
              onSubmitAssignment={setSubmittingAssignment}
              showHeader={false}
            />
          </CardContent>
        </Card>


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

      </div>
    </RealtimePageWrapper>
  )
}
