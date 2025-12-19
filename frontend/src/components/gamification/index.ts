// Barrel exports for gamification components
export { StatCard } from './stat-card'
export { PointsDisplay } from './points-display'
export { MyPointsCard } from './my-points-card'
export { FamilyLeaderboard } from './family-leaderboard'
export { GamingTimeTracker } from './gaming-time-tracker'
export { AchievementGallery } from './achievement-gallery'

// Re-export types
export type { StatCardProps } from './stat-card'
export type { MyPointsCardProps } from './my-points-card'

// Component prop types
export type {
  LeaderboardEntry,
  UserStats,
  Achievement,
  UserAchievement
} from '@/lib/api/gamification'