// User and Authentication Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  // Provider-specific fields
  googleId?: string;
  appleId?: string;
  provider: AuthProvider;
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum AuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  // Future providers
  FACEBOOK = 'facebook',
  MICROSOFT = 'microsoft',
}

export enum UserRole {
  PARENT = 'parent',
  CHILD = 'child',
}

export enum TenantMemberRole {
  ADMIN = 'admin',     // Tenant owner
  PARENT = 'parent',   // Can manage children and chores
  CHILD = 'child',     // Can complete chores
}

// Tenant Types (formerly Family - more flexible for future)
export interface Tenant {
  id: string;
  name: string;
  tenantCode: string;
  type: TenantType;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum TenantType {
  FAMILY = 'family',
  // Future: SCHOOL = 'school', ORGANIZATION = 'organization'
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantMemberRole;
  invitedBy?: string;
  joinedAt: Date;
  isActive: boolean;
}

// Chore Types
export interface Chore {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  pointsReward: number;
  difficultyLevel: DifficultyLevel;
  estimatedDurationMinutes: number;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  startDate?: string; // ISO date string - when recurrence begins (optional for templates)
  endDate?: string; // ISO date string - when recurrence ends (optional)
}

// Chore Recurrence - tracks an active recurring assignment series
export interface ChoreRecurrence {
  id: string;
  tenantId: string;
  templateChoreId: string;
  assignedTo: string; // Which child this recurrence is for
  assignedBy: string; // Which parent created this recurrence
  recurrencePattern: RecurrencePattern;
  priority: Priority;
  lastGeneratedDate: Date; // Track how far we've generated assignments
  isActive: boolean; // Can be deactivated to stop generating new assignments
  createdAt: Date;
  updatedAt: Date;
}

// Chore Instance (snapshot) Types
export interface ChoreInstance {
  id: string;
  tenantId: string;
  templateChoreId: string;
  title: string;
  description: string | null;
  pointsReward: number;
  difficultyLevel: DifficultyLevel;
  estimatedDurationMinutes: number;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chore Assignment Types
export interface ChoreAssignment {
  id: string;
  choreInstanceId: string;
  templateChoreId: string;
  assignedTo: string;
  assignedBy: string;
  dueDate: Date;
  priority: Priority;
  status: AssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum AssignmentStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  OVERDUE = 'overdue',
}

// Submission Types
export interface ChoreSubmission {
  id: string;
  assignmentId: string;
  submittedBy: string;
  submissionNotes?: string;
  mediaUrls: string[];
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewStatus: ReviewStatus;
  reviewFeedback?: string;
  pointsAwarded?: number;
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Gamification Types
export interface UserPoints {
  id: string;
  userId: string;
  tenantId: string;
  totalPoints: number;
  availableGamingMinutes: number;
  usedGamingMinutes: number;
  currentStreakDays: number;
  longestStreakDays: number;
  level: number;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  badgeColor: string;
  requirementType: RequirementType;
  requirementValue: number;
  isActive: boolean;
}

export enum RequirementType {
  STREAK = 'streak',
  POINTS = 'points',
  CHORES_COMPLETED = 'chores_completed',
  LEVEL = 'level',
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: Date;
  tenantId: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
}

export enum NotificationType {
  CHORE_ASSIGNED = 'chore_assigned',
  SUBMISSION_PENDING = 'submission_pending',
  CHORE_APPROVED = 'chore_approved',
  CHORE_REJECTED = 'chore_rejected',
  ACHIEVEMENT_EARNED = 'achievement_earned',
}

// Rewards (Extended beyond gaming time)
export enum RewardType {
  GAMING_TIME = 'gaming_time',
  SOCIAL_OUTING = 'social_outing',
  SPENDING_MONEY = 'spending_money',
  SPECIAL_EXPERIENCE = 'special_experience',
}

export enum RedemptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface RewardRedemption {
  id: string;
  tenantId: string;
  userId: string;
  type: RewardType;
  amount?: number | null; // minutes or monetary units when applicable
  notes?: string | null;
  status: RedemptionStatus;
  requestedAt: Date;
  decidedAt?: Date | null;
  decidedBy?: string | null; // user id of approver
  decidedByUser?: {
    id: string;
    displayName: string;
  } | null; // approver user details when loaded
}

export interface RewardSettings {
  id: string;
  tenantId: string;
  enabledTypes: RewardType[]; // which reward types are available for this tenant
  defaultConversion?: Record<string, unknown>; // reserved for future conversion rules
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Request/Response DTOs
export interface CreateChoreDto {
  title: string;
  description: string;
  pointsReward: number;
  difficultyLevel: DifficultyLevel;
  estimatedDurationMinutes: number;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface SubmitChoreDto {
  submissionNotes?: string;
  mediaUrls: string[];
}

export interface ReviewSubmissionDto {
  reviewStatus: ReviewStatus;
  reviewFeedback?: string;
  pointsAwarded?: number;
}

export interface CreateTenantDto {
  name: string;
  type: TenantType;
}

export interface UpdateProfileDto {
  displayName?: string;
  avatarUrl?: string;
}
