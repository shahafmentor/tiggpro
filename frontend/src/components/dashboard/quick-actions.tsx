'use client'

import { CheckSquare, Users, Eye, Gift, Zap, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDashboardTranslations } from '@/hooks/use-translations'

interface QuickActionsProps {
  onQuickAssignChore: () => void
  onManageChores: () => void
  onFamily: () => void
  onReviewSubmissions: () => void
  onReviewRewards: () => void
}

function QuickActionTile({
  icon: Icon,
  title,
  onClick,
}: {
  icon: LucideIcon
  title: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-auto w-full justify-start gap-3 p-4"
      onClick={onClick}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-left">
        <span className="block text-sm font-medium">{title}</span>
      </span>
    </Button>
  )
}

export function QuickActions({
  onQuickAssignChore,
  onManageChores,
  onFamily,
  onReviewSubmissions,
  onReviewRewards,
}: QuickActionsProps) {
  const t = useDashboardTranslations()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('quickActionsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickActionTile
            icon={Zap}
            title={t('quickActionsQuickAssignChore')}
            onClick={onQuickAssignChore}
          />
          <QuickActionTile
            icon={CheckSquare}
            title={t('quickActionsManageChores')}
            onClick={onManageChores}
          />
          <QuickActionTile
            icon={Users}
            title={t('quickActionsFamily')}
            onClick={onFamily}
          />
          <QuickActionTile
            icon={Eye}
            title={t('quickActionsReviewSubmissions')}
            onClick={onReviewSubmissions}
          />
          <QuickActionTile
            icon={Gift}
            title={t('quickActionsReviewRewards')}
            onClick={onReviewRewards}
          />
        </div>
      </CardContent>
    </Card>
  )
}

