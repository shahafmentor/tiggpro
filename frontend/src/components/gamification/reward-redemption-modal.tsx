'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { rewardsApi, type CostPreviewResponse } from '@/lib/api/rewards'
import { gamificationApi } from '@/lib/api/gamification'
import { useTenant } from '@/lib/contexts/tenant-context'
import { useModalsTranslations } from '@/hooks/use-translations'
import type { RewardType } from '@tiggpro/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Star, Coins } from 'lucide-react'

interface RewardRedemptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialType?: RewardType
  initialAmount?: number
  initialNotes?: string
  onSuccess?: () => void
}

const REWARD_TAB_KEYS: RewardType[] = [
  'gaming_time' as RewardType,
  'social_outing' as RewardType,
  'spending_money' as RewardType,
  'special_experience' as RewardType,
]

export function RewardRedemptionModal({ open, onOpenChange, initialType, initialAmount, initialNotes, onSuccess }: RewardRedemptionModalProps) {
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()
  const t = useModalsTranslations()
  const [activeTab, setActiveTab] = useState<RewardType>((initialType as RewardType) || ('gaming_time' as RewardType))
  const [amount, setAmount] = useState<number | undefined>(initialAmount)
  const [notes, setNotes] = useState(initialNotes || '')

  const tenantId = currentTenant?.tenant?.id

  const { data: settings } = useQuery({
    queryKey: ['rewards-settings', tenantId],
    queryFn: () => tenantId ? rewardsApi.getSettings(tenantId) : Promise.resolve({ success: false } as any),
    enabled: !!tenantId && open,
  })

  const { data: userStats } = useQuery({
    queryKey: ['user-stats', tenantId],
    queryFn: () => tenantId ? gamificationApi.getUserStats(tenantId) : Promise.resolve({ success: false } as any),
    enabled: !!tenantId && open,
  })

  const { data: costPreview } = useQuery({
    queryKey: ['cost-preview', tenantId, activeTab, amount],
    queryFn: () => tenantId && amount ? rewardsApi.getCostPreview(tenantId, { type: activeTab, amount }) : Promise.resolve({ success: false } as any),
    enabled: !!tenantId && !!amount && open,
  })

  const enabledTypes = (settings?.success && (settings as any).data?.enabledTypes) ? (settings as any).data.enabledTypes as RewardType[] : []
  const availablePoints = (userStats?.success && (userStats as any).data?.availablePoints) ? (userStats as any).data.availablePoints : 0
  const previewData = (costPreview?.success && (costPreview as any).data) ? (costPreview as any).data as CostPreviewResponse : null

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error('No tenant')
      return rewardsApi.requestRedemption(tenantId, { type: activeTab, amount, notes })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-redemptions', tenantId] })
      setAmount(undefined)
      setNotes('')
      onOpenChange(false)
      onSuccess?.()
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('rewardRedemption.title')}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coins className="h-4 w-4" />
            <span>{t('rewardRedemption.availablePoints').replace('{points}', availablePoints.toString())}</span>
          </div>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RewardType)}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4">
            {REWARD_TAB_KEYS.filter(key => enabledTypes.length === 0 || enabledTypes.includes(key)).map((key) => (
              <TabsTrigger key={key} value={key}>{t(`rewardRedemption.tabs.${key}`)}</TabsTrigger>
            ))}
          </TabsList>

          {REWARD_TAB_KEYS.map((key) => (
            <TabsContent key={key} value={key} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`amount-${key}`}>{t('rewardRedemption.amount')}</Label>
                <Input
                  id={`amount-${key}`}
                  type="number"
                  min={1}
                  value={amount ?? ''}
                  onChange={(e) => setAmount(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder={key === 'gaming_time' ? t('rewardRedemption.amountPlaceholder.gaming_time') : key === 'spending_money' ? t('rewardRedemption.amountPlaceholder.spending_money') : t('rewardRedemption.amountPlaceholder.default')}
                />
              </div>

              {previewData && amount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Star className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('rewardRedemption.costPreview')}</span>
                  </div>
                  <div className="mt-1 text-sm text-blue-700">
                    <div>• {t('rewardRedemption.cost').replace('{points}', previewData.pointCost.toString())}</div>
                    <div>• {t('rewardRedemption.remaining').replace('{points}', previewData.remainingPoints.toString())}</div>
                    {previewData.remainingPoints < 0 && (
                      <div className="text-red-600 font-medium">• {t('rewardRedemption.insufficientPoints')}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`notes-${key}`}>{t('rewardRedemption.notes')}</Label>
                <Textarea id={`notes-${key}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('rewardRedemption.notesPlaceholder')} />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('rewardRedemption.cancel')}</Button>
          <Button
            onClick={() => requestMutation.mutate()}
            disabled={requestMutation.isPending || (previewData ? previewData.remainingPoints < 0 : false)}
          >
            {requestMutation.isPending ? t('rewardRedemption.submitting') : t('rewardRedemption.submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}



