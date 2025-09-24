'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { rewardsApi } from '@/lib/api/rewards'
import { useTenant } from '@/lib/contexts/tenant-context'
import type { RewardType } from '@tiggpro/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface RewardRedemptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialType?: RewardType
  initialAmount?: number
  initialNotes?: string
  onSuccess?: () => void
}

const REWARD_TABS: { key: RewardType; label: string }[] = [
  { key: 'gaming_time' as RewardType, label: 'Gaming Time' },
  { key: 'social_outing' as RewardType, label: 'Social Outing' },
  { key: 'spending_money' as RewardType, label: 'Spending Money' },
  { key: 'special_experience' as RewardType, label: 'Special Experience' },
]

export function RewardRedemptionModal({ open, onOpenChange, initialType, initialAmount, initialNotes, onSuccess }: RewardRedemptionModalProps) {
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<RewardType>((initialType as RewardType) || ('gaming_time' as RewardType))
  const [amount, setAmount] = useState<number | undefined>(initialAmount)
  const [notes, setNotes] = useState(initialNotes || '')

  const tenantId = currentTenant?.tenant?.id

  const { data: settings } = useQuery({
    queryKey: ['rewards-settings', tenantId],
    queryFn: () => tenantId ? rewardsApi.getSettings(tenantId) : Promise.resolve({ success: false } as any),
    enabled: !!tenantId && open,
  })

  const enabledTypes = (settings?.success && (settings as any).data?.enabledTypes) ? (settings as any).data.enabledTypes as RewardType[] : []

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
          <DialogTitle>Request Reward</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RewardType)}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4">
            {REWARD_TABS.filter(t => enabledTypes.length === 0 || enabledTypes.includes(t.key)).map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>

          {REWARD_TABS.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`amount-${tab.key}`}>Amount</Label>
                <Input
                  id={`amount-${tab.key}`}
                  type="number"
                  min={1}
                  value={amount ?? ''}
                  onChange={(e) => setAmount(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder={tab.key === 'gaming_time' ? 'Minutes (e.g., 30)' : tab.key === 'spending_money' ? 'Amount (e.g., 20)' : 'Optional'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`notes-${tab.key}`}>Notes (optional)</Label>
                <Textarea id={`notes-${tab.key}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add details" />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending}>
            {requestMutation.isPending ? 'Requesting...' : 'Submit Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}



