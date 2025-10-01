'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { rewardsApi } from '@/lib/api/rewards'
import { useTenant } from '@/lib/contexts/tenant-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/semantic-badges'
import { TenantMemberRole } from '@tiggpro/shared'
import { usePagesTranslations, useDashboardTranslations, useCommonTranslations } from '@/hooks/use-translations'
import { Gift, Plus, RefreshCcw } from 'lucide-react'
import { RewardReviewModal } from '@/components/rewards/reward-review-modal'
import { RewardRedemptionModal } from '@/components/gamification/reward-redemption-modal'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { RedemptionReviewTable } from '@/components/rewards/redemption-review-table'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { gamificationApi } from '@/lib/api/gamification'
import { Star } from 'lucide-react'
import { RealtimePageWrapper } from '@/components/realtime/realtime-page-wrapper'

export default function RewardsPage() {
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()
  const tenantId = currentTenant?.tenant?.id
  const isReviewer = currentTenant?.role === TenantMemberRole.ADMIN || currentTenant?.role === TenantMemberRole.PARENT
  const isChild = currentTenant?.role === TenantMemberRole.CHILD
  const p = usePagesTranslations()
  const t = useDashboardTranslations()
  const c = useCommonTranslations()
  const { data: session } = useSession()

  const { data: redemptions, isLoading } = useQuery({
    queryKey: ['rewards-redemptions', tenantId],
    queryFn: () => tenantId ? rewardsApi.listRedemptions(tenantId) : Promise.resolve(null),
    enabled: !!tenantId && !!session,
    refetchInterval: 30000,
  })

  // User Stats (points balance) for children
  const { data: userStatsResponse } = useQuery({
    queryKey: ['user-stats', tenantId],
    queryFn: () => tenantId ? gamificationApi.getUserStats(tenantId) : Promise.resolve(null),
    enabled: !!tenantId && !!session && isChild,
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('No tenant')
      return rewardsApi.approveRedemption(tenantId, id)
    },
    onSuccess: () => {
      toast.success(p('rewards.toasts.rewardApproved'))
      queryClient.invalidateQueries({ queryKey: ['rewards-redemptions', tenantId] })
    },
    onError: () => {
      toast.error(p('rewards.toasts.rewardApproveFailed'))
    }
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('No tenant')
      return rewardsApi.rejectRedemption(tenantId, id)
    },
    onSuccess: () => {
      toast.success(p('rewards.toasts.rewardRejected'))
      queryClient.invalidateQueries({ queryKey: ['rewards-redemptions', tenantId] })
    },
    onError: () => {
      toast.error(p('rewards.toasts.rewardRejectFailed'))
    }
  })

  const [reviewing, setReviewing] = useState<RewardRedemption | null>(null)
  const [requestAgain, setRequestAgain] = useState<RewardRedemption | Record<string, never> | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>(isChild ? 'all' : 'pending')

  const allRedemptions = redemptions?.success ? (redemptions.data || []) : []

  // Filter redemptions for children based on status
  const filteredRedemptions = isChild ? allRedemptions.filter((redemption) => {
    switch (statusFilter) {
      case 'all': return true
      case 'pending': return redemption.status === 'pending'
      case 'approved': return redemption.status === 'approved'
      case 'rejected': return redemption.status === 'rejected'
      default: return true
    }
  }) : allRedemptions



  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session || !currentTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <h2 className="text-2xl font-bold mb-4">{p('rewards.noFamilySelectedTitle')}</h2>
        <p className="text-lg mb-8 text-center max-w-md">{p('rewards.noFamilySelectedDesc')}</p>
      </div>
    )
  }

  return (
    <RealtimePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title={isChild ? p('rewards.titleChild') : p('rewards.title')}
          subtitle={isChild ? p('rewards.subtitleChild') : p('rewards.reviewSubtitle')}
          actions={isChild ? (
            <Button className="gap-2" onClick={() => setRequestAgain({})}>
              <Plus className="h-4 w-4" />
              {p('rewards.requestReward')}
            </Button>
          ) : undefined}
        />

        <RewardReviewModal
          redemption={reviewing}
          open={!!reviewing}
          onOpenChange={(open) => !open && setReviewing(null)}
          onReviewComplete={() => setReviewing(null)}
        />
        <RewardRedemptionModal
          open={!!requestAgain}
          onOpenChange={(open) => !open && setRequestAgain(null)}
          initialType={requestAgain && 'type' in requestAgain ? requestAgain.type : undefined}
          initialAmount={requestAgain && 'amount' in requestAgain ? requestAgain.amount : undefined}
          initialNotes={requestAgain && 'notes' in requestAgain ? requestAgain.notes : undefined}
          onSuccess={() => setRequestAgain(null)}
        />

        {/* Points Balance for Kids */}
        {isChild && userStatsResponse?.success && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {t('myPoints')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userStatsResponse?.data?.availablePoints || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('available')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {userStatsResponse?.data?.totalPoints || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('totalEarned')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Use table for parent/admin view, keep existing UI for children */}
        {isReviewer ? (
          <RedemptionReviewTable
            redemptions={allRedemptions}
            isLoading={isLoading}
            isChild={isChild}
            onReview={(redemption) => setReviewing(redemption)}
            onReject={(redemption) => rejectMutation.mutate(redemption.id)}
            onApprove={(redemption) => approveMutation.mutate(redemption.id)}
            onRequestAgain={(redemption) => setRequestAgain(redemption)}
            emptyStateIcon={<Gift className="h-12 w-12 text-muted-foreground" />}
            emptyStateTitle={isChild ? p('rewards.noRequestsChild') : p('rewards.noRequests')}
            emptyStateDescription={isChild ? p('rewards.createFirstChild') : p('rewards.createFirst')}
            emptyStateAction={isChild ? (
              <Button onClick={() => setRequestAgain({})}>
                <Plus className="h-4 w-4 mr-2" />
                {p('rewards.requestFirst')}
              </Button>
            ) : undefined}
          />
        ) : (
          <>
            {/* Filter Section for Children */}
            <Card>
              <CardHeader>
                <CardTitle>{p('rewards.myRequests')}</CardTitle>
                <div className="flex flex-wrap gap-2 pt-4">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    className="gap-2"
                  >
                    {p('rewards.filterButtons.allRequests')}
                  </Button>
                  <Button
                    variant={statusFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('pending')}
                    className="gap-2"
                  >
                    <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                    {p('rewards.filterButtons.waitingForReview')}
                  </Button>
                  <Button
                    variant={statusFilter === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('approved')}
                    className="gap-2"
                  >
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    {p('rewards.filterButtons.approved')}
                  </Button>
                  <Button
                    variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('rejected')}
                    className="gap-2"
                  >
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    {p('rewards.filterButtons.needChanges')}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Keep existing UI for children */}
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : filteredRedemptions.length === 0 ? (
              <Card>
                <CardContent>
                  <EmptyState
                    icon={<Gift className="h-12 w-12 text-muted-foreground" />}
                    title={p('rewards.noRequestsChild')}
                    description={p('rewards.createFirstChild')}
                    action={
                      <Button onClick={() => setRequestAgain({})}>
                        <Plus className="h-4 w-4 mr-2" />
                        {p('rewards.requestFirst')}
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <div className="space-y-4">
                    {filteredRedemptions.map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{p(`rewards.types.${redemption.type}`)}</Badge>
                          <div>
                            <p className="font-medium">{redemption.notes || c('noNotes')}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(redemption.requestedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={redemption.status} />
                          {redemption.status === 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRequestAgain(redemption)}
                            >
                              <RefreshCcw className="h-3 w-3 mr-1" />
                              {p('rewards.requestAgain')}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

      </div>
    </RealtimePageWrapper>
  )
}