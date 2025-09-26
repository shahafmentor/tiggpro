'use client'

import { Gift, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge, CountBadge } from '@/components/ui/semantic-badges'
import { useDashboardTranslations } from '@/hooks/use-translations'
import { useLocalizedRouter } from '@/hooks/use-localized-router'

interface Reward {
    id: string
    type: string
    status: 'pending' | 'approved' | 'rejected'
    amount?: number
    notes?: string
    requestedAt?: string
}

interface RewardsStatusProps {
    rewards: Reward[]
    isLoading?: boolean
    error?: string | null
}

export function RewardsStatus({
    rewards,
    isLoading = false,
    error = null,
}: RewardsStatusProps) {
    const t = useDashboardTranslations()
    const router = useLocalizedRouter()

    // Calculate status counts
    const statusCounts = {
        pending: rewards.filter(r => r.status === 'pending').length,
        approved: rewards.filter(r => r.status === 'approved').length,
        rejected: rewards.filter(r => r.status === 'rejected').length,
    }

    const totalRewards = rewards.length

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    {t('rewards')}
                    {totalRewards > 0 && (
                        <CountBadge count={totalRewards} className="ml-auto" />
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : error ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>{t('failedToLoadRewards')}</p>
                    </div>
                ) : totalRewards === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <Gift className="h-8 w-8 mx-auto mb-2" />
                        <p>{t('noRewards')}</p>
                        <p className="text-sm">{t('requestReward')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Status Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            {statusCounts.pending > 0 && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {statusCounts.pending}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Pending</div>
                                </div>
                            )}
                            {statusCounts.approved > 0 && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {statusCounts.approved}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Approved</div>
                                </div>
                            )}
                            {statusCounts.rejected > 0 && (
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">
                                        {statusCounts.rejected}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Rejected</div>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => router.push('/dashboard/rewards')}
                            >
                                {t('viewMyRewards')}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
