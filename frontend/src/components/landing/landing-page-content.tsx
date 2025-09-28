'use client'

import { useSession } from 'next-auth/react'
import { useLocalizedRouter } from '@/hooks/use-localized-router'
import { useLandingTranslations } from '@/hooks/use-translations'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function LandingPageContent() {
  const { data: session, status } = useSession()
  const router = useLocalizedRouter()
  const t = useLandingTranslations()

  useEffect(() => {
    // Auto-redirect to dashboard if user is authenticated
    if (status === 'authenticated' && session) {
      // Add a small delay to show user they're being redirected
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [session, status, router])

  // Show redirect message for authenticated users
  if (status === 'authenticated' && session) {
    return (
      <main className="text-center">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 bg-muted rounded-lg">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {t('welcomeBack', { name: session.user.name })}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('redirectingMessage')}
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => router.push('/dashboard')} className="gap-2">
                {t('goToDashboard')} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Show landing page for unauthenticated users
  return (
    <main className="text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-responsive-2xl font-bold text-foreground mb-6">
          {t('mainHeading')}
          <span className="text-primary"> {t('gamificationHighlight')}</span>
        </h2>
        <p className="text-responsive-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('description')}
        </p>

        {/* Demo of our theme system */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('demo.chores.cleanRoom.title')}</span>
                <Badge className="bg-chore-pending text-black">{t('demo.statuses.pending')}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t('demo.chores.cleanRoom.description')}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl">🏆</span>
                <span className="font-bold text-lg text-points-primary">
                  {t('demo.points.available', { points: '15' })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('demo.chores.washDishes.title')}</span>
                <Badge className="bg-chore-completed">{t('demo.statuses.completed')}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t('demo.chores.washDishes.description')}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl">✅</span>
                <span className="font-bold text-lg text-chore-completed">
                  {t('demo.points.earned', { points: '20' })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('demo.chores.walkDog.title')}</span>
                <Badge className="bg-chore-overdue">{t('demo.statuses.overdue')}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t('demo.chores.walkDog.description')}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl">⏰</span>
                <span className="font-bold text-lg text-destructive">
                  {t('demo.points.available', { points: '10' })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-left">{t('demo.progress.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{t('demo.progress.levelProgress')}</span>
                    <span className="text-sm text-muted-foreground">{t('demo.progress.pointsProgress', { current: '75', total: '100' })}</span>
                  </div>
                  <Progress value={75} className="h-3" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-points-primary">{t('demo.progress.values.totalPoints')}</div>
                    <div className="text-sm text-muted-foreground">{t('demo.progress.stats.totalPoints')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-chore-completed">{t('demo.progress.values.completed')}</div>
                    <div className="text-sm text-muted-foreground">{t('demo.progress.stats.completed')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-achievement-gold">{t('demo.progress.values.achievements')}</div>
                    <div className="text-sm text-muted-foreground">{t('demo.progress.stats.achievements')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{t('demo.progress.values.gamingTime')}</div>
                    <div className="text-sm text-muted-foreground">{t('demo.progress.stats.gamingTime')}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
