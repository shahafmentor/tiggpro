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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { RewardReviewModal } from '@/components/rewards/reward-review-modal'
import { RewardRedemptionModal } from '@/components/gamification/reward-redemption-modal'

export default function RewardsPage() {
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()
  const tenantId = currentTenant?.tenant?.id
  const isReviewer = currentTenant?.role === TenantMemberRole.ADMIN || currentTenant?.role === TenantMemberRole.PARENT
  const p = usePagesTranslations()

  const { data: redemptions } = useQuery({
    queryKey: ['rewards-redemptions', tenantId],
    queryFn: () => tenantId ? rewardsApi.listRedemptions(tenantId) : Promise.resolve({ success: false } as any),
    enabled: !!tenantId,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards-redemptions', tenantId] })
  })

  const list = redemptions?.success ? (redemptions.data || []) : []

  // Settings
  const { data: settings } = useQuery({
    queryKey: ['rewards-settings', tenantId],
    queryFn: () => tenantId ? rewardsApi.getSettings(tenantId) : Promise.resolve({ success: false } as any),
    enabled: !!tenantId,
  })

  const enabledTypes = (settings?.success && (settings as any).data?.enabledTypes) ? (settings as any).data.enabledTypes as string[] : []
  const [reviewing, setReviewing] = useState<any | null>(null)
  const [requestAgain, setRequestAgain] = useState<any | null>(null)

  const updateSettingsMutation = useMutation({
    mutationFn: async (newEnabled: string[]) => {
      if (!tenantId) throw new Error('No tenant')
      return rewardsApi.updateSettings(tenantId, { enabledTypes: newEnabled as any })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards-settings', tenantId] })
  })

  const toggleType = (type: string) => {
    const set = new Set(enabledTypes)
    if (set.has(type)) set.delete(type); else set.add(type)
    updateSettingsMutation.mutate(Array.from(set))
  }

  return (
    <div className="space-y-6">
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
      {isReviewer && (
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {p('rewards.settings')}
              {updateSettingsMutation.isPending && (
                <span className="inline-flex items-center text-xs text-muted-foreground" aria-live="polite">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> {p('rewards.saving')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {['gaming_time','social_outing','spending_money','special_experience'].map((t) => (
              <div key={t} className="flex items-center space-x-2">
                <Checkbox id={`type-${t}`} checked={enabledTypes.includes(t)} onCheckedChange={() => toggleType(t)} disabled={updateSettingsMutation.isPending} />
                <Label htmlFor={`type-${t}`}>{p(`rewards.types.${t}` as any)}</Label>
              </div>
            ))}
            <div className="text-xs text-muted-foreground col-span-full">{p('rewards.saveExplanation')}</div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{p('rewards.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {list.length === 0 ? (
            <div className="text-sm text-muted-foreground">{p('rewards.noRequests')}</div>
          ) : (
            list.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => r.status === 'pending' ? setReviewing(r) : undefined}>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{p(`rewards.types.${r.type}` as any)}</Badge>
                  <div className="text-sm">
                    <div>Requested: {new Date(r.requestedAt).toLocaleString()}</div>
                    {r.amount ? <div>Amount: {r.amount}</div> : null}
                    {r.notes ? <div className="text-muted-foreground">{r.notes}</div> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status as any} />
                  {isReviewer && r.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); setReviewing(r) }}>Review</Button>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(r.id) }} disabled={rejectMutation.isPending}>Reject</Button>
                    </>
                  )}
                  {!isReviewer && r.status === 'rejected' && (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setRequestAgain(r) }}>Request Again</Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}


