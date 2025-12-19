'use client'

import type { UserStats } from '@/lib/api/gamification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

export interface MyPointsCardProps {
  stats: UserStats
  className?: string
}

export function MyPointsCard({ stats, className }: MyPointsCardProps) {
  const t = useDashboardTranslations()

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">{t('myPoints')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {stats.availablePoints.toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">{t('available')}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {stats.totalPoints.toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">{t('totalEarned')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

