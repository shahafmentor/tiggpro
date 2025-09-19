'use client'

import { PointsDisplay } from './points-display'
import { AchievementGallery } from './achievement-gallery'
import type { Achievement, UserAchievement, UserStats } from '@/lib/api/gamification'

// Sample data for demo
const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first chore',
    iconUrl: '/icons/first-steps.png',
    badgeColor: '#10B981',
    requirementType: 'chores_completed',
    requirementValue: 1,
    isActive: true,
  },
  {
    id: '2',
    name: 'Point Collector',
    description: 'Earn your first 100 points',
    iconUrl: '/icons/point-collector.png',
    badgeColor: '#3B82F6',
    requirementType: 'points',
    requirementValue: 100,
    isActive: true,
  },
  {
    id: '3',
    name: 'Streak Master',
    description: 'Maintain a 7-day completion streak',
    iconUrl: '/icons/streak-master.png',
    badgeColor: '#F59E0B',
    requirementType: 'streak',
    requirementValue: 7,
    isActive: true,
  },
  {
    id: '4',
    name: 'Level Up',
    description: 'Reach level 3',
    iconUrl: '/icons/level-up.png',
    badgeColor: '#8B5CF6',
    requirementType: 'level',
    requirementValue: 3,
    isActive: true,
  },
  {
    id: '5',
    name: 'Point Master',
    description: 'Earn 1000 total points',
    iconUrl: '/icons/point-master.png',
    badgeColor: '#EF4444',
    requirementType: 'points',
    requirementValue: 1000,
    isActive: true,
  },
]

const mockEarnedAchievements: UserAchievement[] = [
  {
    id: 'earned-1',
    earnedAt: '2024-01-15T10:30:00Z',
    achievement: mockAchievements[0],
  },
  {
    id: 'earned-2',
    earnedAt: '2024-01-20T15:45:00Z',
    achievement: mockAchievements[1],
  },
]

export function PointsDisplayDemo() {
  const userStats: UserStats = {
    totalPoints: 850,
    level: 3,
    currentStreakDays: 12,
    longestStreakDays: 18,
    availableGamingMinutes: 120,
    usedGamingMinutes: 30,
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold">Gamification UI Demo</h2>

      {/* Points Display Demo */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Points Display Component</h3>
        <PointsDisplay
          totalPoints={userStats.totalPoints}
          level={userStats.level}
          currentStreakDays={userStats.currentStreakDays}
          longestStreakDays={userStats.longestStreakDays}
          availableGamingMinutes={userStats.availableGamingMinutes}
          animated={true}
        />
      </div>

      {/* Achievement Gallery Demo */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Achievement Gallery Component</h3>
        <AchievementGallery
          availableAchievements={mockAchievements}
          earnedAchievements={mockEarnedAchievements}
          userStats={userStats}
        />
      </div>
    </div>
  )
}