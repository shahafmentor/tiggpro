'use client'

import { PageHeader } from '@/components/layout/page-header'
import { usePagesTranslations } from '@/hooks/use-translations'
import { Card, CardContent } from '@/components/ui/card'

export default function AchievementsPage() {
  const p = usePagesTranslations()
  return (
    <div className="space-y-6">
      <PageHeader title={p('achievements.title')} subtitle={p('achievements.subtitle')} />
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Achievements are not part of the MVP yet.
        </CardContent>
      </Card>
    </div>
  )
}
