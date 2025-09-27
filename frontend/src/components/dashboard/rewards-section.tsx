'use client'

import { useState } from 'react'
import { Gift, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge, CountBadge } from '@/components/ui/semantic-badges'
import { useDashboardTranslations, usePagesTranslations } from '@/hooks/use-translations'
import { useLocalizedRouter } from '@/hooks/use-localized-router'
import type { RewardType, RedemptionStatus } from '@tiggpro/shared'

interface Reward {
  id: string
  type: RewardType
  status: RedemptionStatus
  amount?: number
  notes?: string
  requestedAt?: string
}

interface RewardsSectionProps {
  rewards: Reward[]
  isLoading?: boolean
  error?: string | null
  onRequestReward: () => void
}

export function RewardsSection({
  rewards,
  isLoading = false,
  error = null,
  onRequestReward
}: RewardsSectionProps) {
  const [showAllRewards, setShowAllRewards] = useState(false)
  const t = useDashboardTranslations()
  const pagesT = usePagesTranslations()
  const router = useLocalizedRouter()

  const getRewardTypeDisplay = (type: RewardType) => {
    return pagesT(`rewards.types.${type}`)
  }

  const getRewardIcon = (type: string) => {
    // You can customize icons based on reward type
    return <Gift className="h-5 w-5" />
  }

  const getRewardStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-reward-approved/10 text-reward-approved'
      case 'rejected':
        return 'bg-reward-rejected/10 text-reward-rejected'
      case 'pending':
      default:
        return 'bg-reward-pending/10 text-reward-pending'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          {t('rewards')}
          {rewards.length > 0 && (
            <CountBadge count={rewards.length} className="ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={onRequestReward}>
            {t('requestReward')}
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/rewards')}>
            {t('viewMyRewards')}
          </Button>
        </div>

        {isLoading ? (
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
        ) : error ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{t('failedToLoadRewards')}</p>
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Gift className="h-8 w-8 mx-auto mb-2" />
            <p>{t('noRewards')}</p>
            <p className="text-sm">{t('requestYourFirstReward')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAllRewards ? rewards : rewards.slice(0, 3)).map((reward) => (
              <div
                key={reward.id}
                className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRewardStatusColor(reward.status)}`}>
                    {getRewardIcon(reward.type)}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {getRewardTypeDisplay(reward.type)}
                  </p>
                  {reward.amount && (
                    <p className="text-xs text-muted-foreground">
                      {reward.amount} {reward.type === 'spending_money' ? t('dollars') : t('minutes')}
                    </p>
                  )}
                  {reward.notes && (
                    <p className="text-xs text-muted-foreground truncate">
                      {reward.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={reward.status} />
                </div>
              </div>
            ))}
            {rewards.length > 3 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowAllRewards(!showAllRewards)}
              >
                {showAllRewards ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    {t('showLess')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    {t('viewAllRewards').replace('{count}', String(rewards.length))}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
