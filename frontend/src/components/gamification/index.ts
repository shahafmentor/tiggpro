// Barrel exports for gamification components
export { StatCard } from './stat-card'
export { PointsDisplay } from './points-display'
export { FamilyLeaderboard } from './family-leaderboard'
export { GamingTimeTracker } from './gaming-time-tracker'
export { AchievementGallery } from './achievement-gallery'

// Re-export types
export type { StatCardProps } from './stat-card'

// Component prop types
export type {
  LeaderboardEntry,
  UserStats,
  Achievement,
  UserAchievement
} from '@/lib/api/gamification'