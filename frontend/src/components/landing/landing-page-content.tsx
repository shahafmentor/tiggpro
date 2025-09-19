'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function LandingPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

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
              Welcome back, {session.user.name}! 👋
            </h2>
            <p className="text-muted-foreground mb-6">
              Redirecting you to your dashboard...
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => router.push('/dashboard')} className="gap-2">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
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
          Make Chores Fun with
          <span className="text-primary"> Gamification</span>
        </h2>
        <p className="text-responsive-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Transform household chores into exciting games.
          Kids earn gaming time by completing tasks, while parents
          manage family activities with ease.
        </p>

        {/* Demo of our theme system */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🧹 Clean Room</span>
                <Badge className="bg-chore-pending text-black">Pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Organize bedroom and make the bed
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl">🏆</span>
                <span className="font-bold text-lg text-points-primary">
                  15 pts
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🍽️ Wash Dishes</span>
                <Badge className="bg-chore-completed">Completed</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Clean all dishes and put them away
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl">✅</span>
                <span className="font-bold text-lg text-chore-completed">
                  +20 pts
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🐕 Walk Dog</span>
                <Badge className="bg-chore-overdue">Overdue</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Take Max for a 15-minute walk
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl">⏰</span>
                <span className="font-bold text-lg text-destructive">
                  10 pts
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-left">📊 Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Level Progress</span>
                    <span className="text-sm text-muted-foreground">75/100 pts</span>
                  </div>
                  <Progress value={75} className="h-3" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-points-primary">127</div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-chore-completed">8</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-achievement-gold">3</div>
                    <div className="text-sm text-muted-foreground">Achievements</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">45min</div>
                    <div className="text-sm text-muted-foreground">Gaming Time</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <p className="text-responsive-base text-muted-foreground">
            🎨 <strong>Theme System Demo:</strong> Try switching between light/dark themes and parent/kid modes using the controls above!
          </p>
        </div>
      </div>
    </main>
  )
}
