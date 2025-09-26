'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form'
import { rewardsApi } from '@/lib/api/rewards'
import { useTenant } from '@/lib/contexts/tenant-context'
import { toast } from 'sonner'
import { Loader2, Settings, Gamepad2, DollarSign, Star, Zap } from 'lucide-react'
import { usePagesTranslations } from '@/hooks/use-translations'
import { RewardType } from '@tiggpro/shared'

const rewardSettingsSchema = z.object({
  enabledTypes: z.array(z.string()),
  conversion: z.object({
    pointsPerMinute: z
      .number()
      .min(1, 'Must be at least 1 point per minute')
      .max(100, 'Cannot exceed 100 points per minute'),
    fixedCosts: z.object({
      social_outing: z
        .number()
        .min(0, 'Cannot be negative')
        .max(10000, 'Cannot exceed 10000 points'),
      special_experience: z
        .number()
        .min(0, 'Cannot be negative')
        .max(10000, 'Cannot exceed 10000 points'),
    }),
    spendingMoney: z.object({
      perUnit: z
        .number()
        .min(1, 'Must be at least 1 point per unit')
        .max(1000, 'Cannot exceed 1000 points per unit'),
    }),
  }),
})

type RewardSettingsForm = z.infer<typeof rewardSettingsSchema>

interface UnifiedRewardSettingsProps {
  settings?: {
    enabledTypes?: string[]
    conversion?: {
      pointsPerMinute?: number
      fixedCosts?: Partial<Record<string, number>>
      spendingMoney?: { perUnit: number }
    }
  }
}

const rewardTypes = [
  {
    key: 'gaming_time',
    icon: Gamepad2,
    iconColor: 'text-primary',
    conversionType: 'rate',
    conversionField: 'pointsPerMinute',
    conversionLabel: 'Points per minute',
    conversionMin: 1,
    conversionMax: 100,
  },
  {
    key: 'social_outing',
    icon: Star,
    iconColor: 'text-yellow-500',
    conversionType: 'fixed',
    conversionField: 'fixedCosts.social_outing',
    conversionLabel: 'Fixed cost (points)',
    conversionMin: 0,
    conversionMax: 10000,
  },
  {
    key: 'spending_money',
    icon: DollarSign,
    iconColor: 'text-green-500',
    conversionType: 'rate',
    conversionField: 'spendingMoney.perUnit',
    conversionLabel: 'Points per currency unit',
    conversionMin: 1,
    conversionMax: 1000,
  },
  {
    key: 'special_experience',
    icon: Zap,
    iconColor: 'text-purple-500',
    conversionType: 'fixed',
    conversionField: 'fixedCosts.special_experience',
    conversionLabel: 'Fixed cost (points)',
    conversionMin: 0,
    conversionMax: 10000,
  },
]

export function UnifiedRewardSettings({ settings }: UnifiedRewardSettingsProps) {
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()
  const tenantId = currentTenant?.tenant?.id
  const p = usePagesTranslations()

  const form = useForm<RewardSettingsForm>({
    resolver: zodResolver(rewardSettingsSchema),
    defaultValues: {
      enabledTypes: settings?.enabledTypes || [],
      conversion: {
        pointsPerMinute: settings?.conversion?.pointsPerMinute || 5,
        fixedCosts: {
          social_outing: settings?.conversion?.fixedCosts?.social_outing || 100,
          special_experience: settings?.conversion?.fixedCosts?.special_experience || 200,
        },
        spendingMoney: {
          perUnit: settings?.conversion?.spendingMoney?.perUnit || 10,
        },
      },
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: RewardSettingsForm) => {
      if (!tenantId) throw new Error('No tenant')
      return rewardsApi.updateSettings(tenantId, {
        enabledTypes: data.enabledTypes as RewardType[],
        conversion: data.conversion,
      })
    },
    onSuccess: () => {
      toast.success('Reward settings updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['rewards-settings', tenantId] })
    },
    onError: (error) => {
      console.error('Settings update failed:', error)
      toast.error('Failed to update settings')
    },
  })

  const onSubmit = (data: RewardSettingsForm) => {
    updateSettingsMutation.mutate(data)
  }

  const toggleRewardType = (type: string, enabled: boolean) => {
    const currentEnabled = form.getValues('enabledTypes')
    const newEnabled = enabled
      ? [...currentEnabled, type]
      : currentEnabled.filter(t => t !== type)
    form.setValue('enabledTypes', newEnabled)
  }


  const enabledTypes = form.watch('enabledTypes')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {p('rewards.settings')}
          {updateSettingsMutation.isPending && (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Saving...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {rewardTypes.map((rewardType) => {
              const Icon = rewardType.icon
              const isEnabled = enabledTypes.includes(rewardType.key)

              return (
                <div key={rewardType.key} className="flex items-center gap-4 p-4 border rounded-lg">
                  {/* Enable/Disable Checkbox */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`type-${rewardType.key}`}
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleRewardType(rewardType.key, !!checked)}
                      disabled={updateSettingsMutation.isPending}
                    />
                    <Label
                      htmlFor={`type-${rewardType.key}`}
                      className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                    >
                      <Icon className={`h-4 w-4 ${rewardType.iconColor}`} />
                      {p(`rewards.types.${rewardType.key}` as any)}
                    </Label>
                  </div>

                  {/* Conversion Settings */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground min-w-fit">
                        {rewardType.conversionLabel}:
                      </Label>
                      <FormField
                        control={form.control}
                        name={`conversion.${rewardType.conversionField.replace(/^conversion\./, '')}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={rewardType.conversionMin}
                                max={rewardType.conversionMax}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || rewardType.conversionMin)}
                                disabled={updateSettingsMutation.isPending || !isEnabled}
                                className="w-24 h-8"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                {p('rewards.saveExplanation')}
              </p>
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                size="sm"
              >
                {updateSettingsMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}