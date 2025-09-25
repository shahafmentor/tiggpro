import { PageHeader } from '@/components/layout/page-header'
import { usePagesTranslations } from '@/hooks/use-translations'
'use client'

import { AchievementGallery } from '@/components/gamification/achievement-gallery'
import type { Achievement, UserAchievement, UserStats } from '@/lib/api/gamification'

// Mock data for demonstration
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
  {
    id: '6',
    name: 'Speed Demon',
    description: 'Complete 5 chores in one day',
    iconUrl: '/icons/speed-demon.png',
    badgeColor: '#EC4899',
    requirementType: 'chores_completed',
    requirementValue: 5,
    isActive: true,
  },
  {
    id: '7',
    name: 'Consistency King',
    description: 'Maintain a 30-day streak',
    iconUrl: '/icons/consistency-king.png',
    badgeColor: '#F97316',
    requirementType: 'streak',
    requirementValue: 30,
    isActive: true,
  },
  {
    id: '8',
    name: 'Elite Level',
    description: 'Reach level 10',
    iconUrl: '/icons/elite-level.png',
    badgeColor: '#6366F1',
    requirementType: 'level',
    requirementValue: 10,
    isActive: true,
  },
]

const mockEarnedAchievements: UserAchievement[] = [
  {
    id: 'earned-1',
    earnedAt: '2024-01-15T10:30:00Z',
    achievement: mockAchievements[0], // First Steps
  },
  {
    id: 'earned-2',
    earnedAt: '2024-01-20T15:45:00Z',
    achievement: mockAchievements[1], // Point Collector
  },
  {
    id: 'earned-3',
    earnedAt: '2024-01-25T09:15:00Z',
    achievement: mockAchievements[2], // Streak Master
  },
]

const mockUserStats: UserStats = {
  totalPoints: 850,
  availablePoints: 120,
  spentPoints: 730,
  level: 3,
  currentStreakDays: 12,
  longestStreakDays: 18,
}

export default function AchievementsPage() {
  const p = usePagesTranslations()
  return (
    <div className="space-y-6">
      <PageHeader title={p('achievements.title')} subtitle={p('achievements.subtitle')} />
      <AchievementGallery
        availableAchievements={mockAchievements}
        earnedAchievements={mockEarnedAchievements}
        userStats={mockUserStats}
      />
    </div>
  )
}