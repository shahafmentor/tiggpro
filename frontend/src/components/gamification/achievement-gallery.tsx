'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Trophy,
  Medal,
  Star,
  Crown,
  Target,
  Zap,
  Clock,
  Flame,
  Calendar,
  CheckCircle,
  Lock,
  Award,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Achievement, UserAchievement, UserStats } from '@/lib/api/gamification'

interface AchievementGalleryProps {
  availableAchievements: Achievement[]
  earnedAchievements: UserAchievement[]
  userStats: UserStats
  className?: string
}

// Map requirement types to icons
const requirementIcons = {
  streak: Flame,
  points: Star,
  chores_completed: CheckCircle,
  level: Crown,
} as const

// Get achievement progress
function getAchievementProgress(achievement: Achievement, userStats: UserStats): number {
  const current = {
    streak: userStats.currentStreakDays,
    points: userStats.totalPoints,
    chores_completed: 0, // TODO: Get from user stats when available
    level: userStats.level,
  }[achievement.requirementType] || 0

  return Math.min((current / achievement.requirementValue) * 100, 100)
}

// Check if achievement is earned
function isAchievementEarned(achievement: Achievement, earnedAchievements: UserAchievement[]): boolean {
  return earnedAchievements.some(earned => earned.achievement.id === achievement.id)
}

// Achievement card component
function AchievementCard({
  achievement,
  isEarned,
  progress,
  earnedDate,
  animate = true,
}: {
  achievement: Achievement
  isEarned: boolean
  progress: number
  earnedDate?: string
  animate?: boolean
}) {
  const IconComponent = requirementIcons[achievement.requirementType] || Trophy
  const isNearCompletion = progress >= 80 && !isEarned

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="w-full"
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          isEarned
            ? "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-600"
            : isNearCompletion
            ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-300 dark:border-blue-600"
            : "bg-card hover:bg-muted/50"
        )}
      >
        {/* Background pattern for earned achievements */}
        {isEarned && (
          <div className="absolute inset-0 opacity-10">
            <Sparkles className="absolute top-2 right-2 h-6 w-6 text-yellow-500" />
            <Sparkles className="absolute bottom-4 left-4 h-4 w-4 text-yellow-400" />
            <Sparkles className="absolute top-1/2 left-1/2 h-3 w-3 text-yellow-600" />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  isEarned
                    ? "bg-yellow-100 dark:bg-yellow-900/50"
                    : "bg-muted"
                )}
                style={{ backgroundColor: isEarned ? achievement.badgeColor + '20' : undefined }}
              >
                {isEarned ? (
                  <Trophy className="h-5 w-5" style={{ color: achievement.badgeColor }} />
                ) : progress >= 80 ? (
                  <IconComponent className="h-5 w-5 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <CardTitle className={cn(
                  "text-sm font-medium",
                  isEarned ? "text-foreground" : "text-muted-foreground"
                )}>
                  {achievement.name}
                </CardTitle>
                {isEarned && earnedDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Earned {new Date(earnedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {isEarned && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
              >
                <Award className="h-3 w-3 mr-1" />
                Earned
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className={cn(
            "text-sm mb-3",
            isEarned ? "text-foreground" : "text-muted-foreground"
          )}>
            {achievement.description}
          </p>

          {/* Progress section */}
          {!isEarned && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className={cn(
                  "font-medium",
                  progress >= 80 ? "text-primary" : "text-muted-foreground"
                )}>
                  {progress.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={progress}
                className={cn(
                  "h-2",
                  progress >= 80 && "bg-primary/20"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{achievement.requirementValue}</span>
              </div>
            </div>
          )}

          {/* Requirement badge */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              <IconComponent className="h-3 w-3 mr-1" />
              {achievement.requirementType.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {achievement.requirementValue}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function AchievementGallery({
  availableAchievements,
  earnedAchievements,
  userStats,
  className
}: AchievementGalleryProps) {
  const [activeTab, setActiveTab] = useState('all')

  // Categorize achievements
  const earnedSet = new Set(earnedAchievements.map(ea => ea.achievement.id))
  const earnedList = availableAchievements.filter(a => earnedSet.has(a.id))
  const notEarnedList = availableAchievements.filter(a => !earnedSet.has(a.id))
  const nearCompletionList = notEarnedList.filter(a => getAchievementProgress(a, userStats) >= 80)

  // Get earned date for achievement
  const getEarnedDate = (achievementId: string): string | undefined => {
    return earnedAchievements.find(ea => ea.achievement.id === achievementId)?.earnedAt
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Achievement Gallery</h2>
        </div>
        <p className="text-muted-foreground">
          Track your progress and celebrate your accomplishments
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Medal className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{earnedList.length}</div>
            <div className="text-xs text-muted-foreground">Earned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{nearCompletionList.length}</div>
            <div className="text-xs text-muted-foreground">Almost There</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{notEarnedList.length}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">
              {Math.round((earnedList.length / availableAchievements.length) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({availableAchievements.length})</TabsTrigger>
          <TabsTrigger value="earned">Earned ({earnedList.length})</TabsTrigger>
          <TabsTrigger value="progress">Progress ({nearCompletionList.length})</TabsTrigger>
          <TabsTrigger value="locked">Locked ({notEarnedList.length - nearCompletionList.length})</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="all" className="space-y-4">
            <motion.div
              key="all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {availableAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AchievementCard
                    achievement={achievement}
                    isEarned={earnedSet.has(achievement.id)}
                    progress={getAchievementProgress(achievement, userStats)}
                    earnedDate={getEarnedDate(achievement.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="earned" className="space-y-4">
            <motion.div
              key="earned"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {earnedList.length > 0 ? (
                earnedList.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AchievementCard
                      achievement={achievement}
                      isEarned={true}
                      progress={100}
                      earnedDate={getEarnedDate(achievement.id)}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-full text-center py-12"
                >
                  <Medal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No achievements earned yet</h3>
                  <p className="text-muted-foreground">Complete chores and activities to earn your first achievement!</p>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {nearCompletionList.length > 0 ? (
                nearCompletionList.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AchievementCard
                      achievement={achievement}
                      isEarned={false}
                      progress={getAchievementProgress(achievement, userStats)}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-full text-center py-12"
                >
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No achievements in progress</h3>
                  <p className="text-muted-foreground">Keep working to make progress on your achievements!</p>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="locked" className="space-y-4">
            <motion.div
              key="locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {notEarnedList.filter(a => getAchievementProgress(a, userStats) < 80).map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AchievementCard
                    achievement={achievement}
                    isEarned={false}
                    progress={getAchievementProgress(achievement, userStats)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}