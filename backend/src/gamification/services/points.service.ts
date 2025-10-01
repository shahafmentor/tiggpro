import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints, ChoreSubmission } from '@/entities';
import { DifficultyLevel } from '@tiggpro/shared';
import { AchievementsService } from './achievements.service';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(UserPoints)
    private userPointsRepository: Repository<UserPoints>,
    @Inject(forwardRef(() => AchievementsService))
    private achievementsService: AchievementsService,
  ) {}

  async awardPoints(
    userId: string,
    tenantId: string,
    submission: ChoreSubmission,
  ): Promise<UserPoints> {
    // Get or create user points record
    let userPoints = await this.userPointsRepository.findOne({
      where: { userId, tenantId },
    });

    if (!userPoints) {
      userPoints = this.userPointsRepository.create({
        userId,
        tenantId,
        totalPoints: 0,
        availablePoints: 0,
        spentPoints: 0,
        currentStreakDays: 0,
        longestStreakDays: 0,
        level: 1,
      });
    }

    // Add points only (no direct gaming time from chores)
    const pointsAwarded = submission.pointsAwarded || 0;
    userPoints.totalPoints += pointsAwarded;
    userPoints.availablePoints += pointsAwarded;

    // Calculate level based on points
    userPoints.level = this.calculateLevel(userPoints.totalPoints);

    // Update streak (simplified - in real implementation, check if consecutive days)
    // For now, increment streak for any completed chore
    userPoints.currentStreakDays += 1;

    if (userPoints.currentStreakDays > userPoints.longestStreakDays) {
      userPoints.longestStreakDays = userPoints.currentStreakDays;
    }

    const updatedUserPoints = await this.userPointsRepository.save(userPoints);

    // 🏆 CHECK AND AWARD ACHIEVEMENTS after points update
    try {
      await this.achievementsService.checkAndAwardAchievements(
        userId,
        tenantId,
      );
    } catch (error) {
      // Log error but don't fail the points award if achievement check fails
      console.error('Failed to check achievements for user:', userId, error);
    }

    return updatedUserPoints;
  }

  async getUserStats(
    userId: string,
    tenantId: string,
  ): Promise<UserPoints | null> {
    return this.userPointsRepository.findOne({
      where: { userId, tenantId },
    });
  }

  async getTenantLeaderboard(tenantId: string): Promise<UserPoints[]> {
    return this.userPointsRepository.find({
      where: { tenantId },
      relations: ['user'],
      order: { totalPoints: 'DESC' },
      take: 10, // Top 10
    });
  }

  private calculateLevel(totalPoints: number): number {
    // Simple level calculation: every 100 points = 1 level
    // Level 1 = 0-99 points, Level 2 = 100-199 points, etc.
    return Math.floor(totalPoints / 100) + 1;
  }

  calculateBonusMultiplier(
    difficultyLevel: DifficultyLevel,
    streakDays: number,
  ): number {
    let multiplier = 1;

    // Difficulty bonus
    switch (difficultyLevel) {
      case DifficultyLevel.EASY:
        multiplier *= 1;
        break;
      case DifficultyLevel.MEDIUM:
        multiplier *= 1.5;
        break;
      case DifficultyLevel.HARD:
        multiplier *= 2;
        break;
    }

    // Streak bonus (5% per day, max 50%)
    const streakBonus = Math.min(streakDays * 0.05, 0.5);
    multiplier *= 1 + streakBonus;

    return multiplier;
  }
}
