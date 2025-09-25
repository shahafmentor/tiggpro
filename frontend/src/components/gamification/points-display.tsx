'use client'

import { useEffect, useState } from 'react'
import { useSpring, useTransform } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatCard } from './stat-card'
import {
  Star,
  Clock,
  Flame,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PointsDisplayProps {
  totalPoints: number
  availablePoints: number
  spentPoints: number
  level: number
  currentStreakDays: number
  longestStreakDays: number
  className?: string
  animated?: boolean
}

// Calculate level progress (points needed for next level)
function getLevelProgress(level: number, totalPoints: number) {
  // Simple progression: level 1 = 0-99 points, level 2 = 100-299 points, etc.
  const currentLevelMinPoints = level === 1 ? 0 : Math.pow(level - 1, 2) * 100
  const nextLevelMinPoints = Math.pow(level, 2) * 100
  const pointsInCurrentLevel = totalPoints - currentLevelMinPoints
  const pointsNeededForCurrentLevel = nextLevelMinPoints - currentLevelMinPoints

  return {
    currentLevelPoints: pointsInCurrentLevel,
    totalLevelPoints: pointsNeededForCurrentLevel,
    progressPercentage: Math.min((pointsInCurrentLevel / pointsNeededForCurrentLevel) * 100, 100),
    pointsToNextLevel: Math.max(nextLevelMinPoints - totalPoints, 0)
  }
}

// Animated counter component
function AnimatedCounter({
  value,
  duration = 1000,
  className
}: {
  value: number
  duration?: number
  className?: string
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const spring = useSpring(displayValue, {
    duration,
    bounce: 0.25
  })
  const rounded = useTransform(spring, latest => Math.round(latest))

  useEffect(() => {
    setDisplayValue(value)
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    return rounded.on('change', latest => {
      setDisplayValue(latest)
    })
  }, [rounded])

  return (
    <span className={className}>
      {displayValue.toLocaleString()}
    </span>
  )
}

export function PointsDisplay({
  totalPoints,
  availablePoints,
  spentPoints,
  level,
  currentStreakDays,
  longestStreakDays,
  className,
  animated = true
}: PointsDisplayProps) {
  const levelProgress = getLevelProgress(level, totalPoints)

  // Data configuration for each stat card
  const statCards = [
    {
      title: "Total Points",
      value: animated ? <AnimatedCounter value={totalPoints} /> : totalPoints.toLocaleString(),
      icon: Zap,
      iconColor: "text-points-primary",
      valueColor: "text-points-primary",
      delay: 0,
      children: (
        <Badge variant="outline" className="text-xs w-fit">
          <Star className="h-3 w-3 mr-1" />
          Level {level}
        </Badge>
      )
    },
    {
      title: "Current Level",
      value: `Level ${level}`,
      icon: Star,
      iconColor: "text-achievement-gold",
      valueColor: "text-achievement-gold",
      delay: 0.1,
      children: (
        <div className="space-y-2">
          <Progress value={levelProgress.progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {levelProgress.pointsToNextLevel} points to Level {level + 1}
          </p>
        </div>
      )
    },
    {
      title: "Current Streak",
      value: animated ? (
        <>
          <AnimatedCounter value={currentStreakDays} /> days
        </>
      ) : (
        `${currentStreakDays} days`
      ),
      subtitle: `Best: ${longestStreakDays} days 🔥`,
      icon: Flame,
      iconColor: "text-orange-500",
      valueColor: "text-orange-600 dark:text-orange-400",
      delay: 0.2
    },
    {
      title: "Available Points",
      value: animated ? (
        <>
          <AnimatedCounter value={availablePoints} />
        </>
      ) : (
        availablePoints.toLocaleString()
      ),
      subtitle: `${spentPoints.toLocaleString()} spent`,
      icon: Zap,
      iconColor: "text-green-500",
      valueColor: "text-green-600 dark:text-green-400",
      delay: 0.3
    }
  ]

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {statCards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          iconColor={card.iconColor}
          valueColor={card.valueColor}
          animated={animated}
          delay={card.delay}
        >
          {card.children}
        </StatCard>
      ))}
    </div>
  )
}