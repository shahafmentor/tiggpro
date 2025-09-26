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
import { usePagesTranslations } from '@/hooks/use-translations'
import { Gift, Plus, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Eye, RefreshCcw } from 'lucide-react'
import { RewardReviewModal } from '@/components/rewards/reward-review-modal'
import { RewardRedemptionModal } from '@/components/gamification/reward-redemption-modal'
import { UnifiedRewardSettings } from '@/components/settings/unified-reward-settings'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from 'next-auth/react'
import { useLocalizedRouter } from '@/hooks/use-localized-router'
import { toast } from 'sonner'

export default function RewardsPage() {
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()
  const tenantId = currentTenant?.tenant?.id
  const isReviewer = currentTenant?.role === TenantMemberRole.ADMIN || currentTenant?.role === TenantMemberRole.PARENT
  const isChild = currentTenant?.role === TenantMemberRole.CHILD
  const p = usePagesTranslations()
  const { data: session } = useSession()
  const router = useLocalizedRouter()

  const { data: redemptions, isLoading } = useQuery({
    queryKey: ['rewards-redemptions', tenantId],
    queryFn: () => tenantId ? rewardsApi.listRedemptions(tenantId) : Promise.resolve({ success: false } as any),
    enabled: !!tenantId && !!session,
    refetchInterval: 30000,
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('No tenant')
      return rewardsApi.approveRedemption(tenantId, id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards-redemptions', tenantId] })
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('No tenant')
      return rewardsApi.rejectRedemption(tenantId, id)
    },
    onSuccess: () => {
      toast.success('Reward request rejected successfully!')
      queryClient.invalidateQueries({ queryKey: ['rewards-redemptions', tenantId] })
    },
    onError: () => {
      toast.error('Failed to reject reward request')
    }
  })

  const allRedemptions = redemptions?.success ? (redemptions.data || []) : []

  // Filter based on user role
  const displayRedemptions = allRedemptions.filter((redemption: any) => {
    // If user is a child, only show their own redemptions
    if (isChild) {
      return redemption.requestedBy?.id === session?.user?.id
    }
    // For reviewers, show all redemptions
    return true
  })

  // Settings
  const { data: settings } = useQuery({
    queryKey: ['rewards-settings', tenantId],
    queryFn: () => tenantId ? rewardsApi.getSettings(tenantId) : Promise.resolve({ success: false } as any),
    enabled: !!tenantId,
  })

  const [reviewing, setReviewing] = useState<any | null>(null)
  const [requestAgain, setRequestAgain] = useState<any | null>(null)
  const [sortField, setSortField] = useState<string>('requestedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Sort redemptions
  const sortedRedemptions = [...displayRedemptions].sort((a: any, b: any) => {
    let aVal, bVal

    switch (sortField) {
      case 'type':
        aVal = p(`rewards.types.${a.type}` as any)
        bVal = p(`rewards.types.${b.type}` as any)
        break
      case 'requestedBy':
        aVal = a.requestedBy?.displayName || a.requestedBy?.email || ''
        bVal = b.requestedBy?.displayName || b.requestedBy?.email || ''
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      case 'requestedAt':
        aVal = new Date(a.requestedAt).getTime()
        bVal = new Date(b.requestedAt).getTime()
        break
      case 'amount':
        aVal = a.amount || 0
        bVal = b.amount || 0
        break
      default:
        aVal = a.requestedAt
        bVal = b.requestedAt
    }

    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isChild ? p('rewards.titleChild') : p('rewards.title')}
        subtitle={isChild ? p('rewards.subtitleChild') : p('rewards.subtitle')}
        actions={!isChild ? (
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
        initialType={(requestAgain?.type as any) || undefined}
        initialAmount={requestAgain?.amount}
        initialNotes={requestAgain?.notes}
        onSuccess={() => setRequestAgain(null)}
      />

      {/* Unified Reward Settings for Reviewers */}
      {isReviewer && (
        <UnifiedRewardSettings settings={settings?.success ? settings.data : undefined} />
      )}

      {/* Rewards Table */}
      {sortedRedemptions.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Gift className="h-12 w-12 text-muted-foreground" />}
              title={isChild ? p('rewards.noRequestsChild') : p('rewards.noRequests')}
              description={isChild ? p('rewards.createFirstChild') : p('rewards.createFirst')}
              action={!isChild ? (
                <Button onClick={() => setRequestAgain({})}>
                  <Plus className="h-4 w-4 mr-2" />
                  {p('rewards.requestFirst')}
                </Button>
              ) : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isChild ? p('rewards.myRequests') : p('rewards.allRequests')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-2">
                      Type
                      {getSortIcon('type')}
                    </div>
                  </TableHead>
                  {!isChild && (
                    <TableHead
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('requestedBy')}
                    >
                      <div className="flex items-center gap-2">
                        Requested By
                        {getSortIcon('requestedBy')}
                      </div>
                    </TableHead>
                  )}
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-2">
                      Amount
                      {getSortIcon('amount')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('requestedAt')}
                  >
                    <div className="flex items-center gap-2">
                      Requested At
                      {getSortIcon('requestedAt')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRedemptions.map((redemption: any) => (
                  <TableRow key={redemption.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary">{p(`rewards.types.${redemption.type}` as any)}</Badge>
                        {redemption.notes && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {redemption.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {!isChild && (
                      <TableCell>
                        {redemption.requestedBy ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={redemption.requestedBy.avatarUrl}
                                alt={redemption.requestedBy.displayName || redemption.requestedBy.email}
                              />
                              <AvatarFallback className="text-xs">
                                {(redemption.requestedBy.displayName || redemption.requestedBy.email)
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {redemption.requestedBy.displayName || redemption.requestedBy.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unknown</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {redemption.amount ? (
                        <span className="text-sm">{redemption.amount}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={redemption.status as any} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(redemption.requestedAt).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {isReviewer && redemption.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setReviewing(redemption)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectMutation.mutate(redemption.id)}
                              disabled={rejectMutation.isPending}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {!isReviewer && redemption.status === 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRequestAgain(redemption)}
                          >
                            <RefreshCcw className="h-3 w-3 mr-1" />
                            Request Again
                          </Button>
                        )}
                        {redemption.status === 'pending' && !isReviewer && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReviewing(redemption)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}