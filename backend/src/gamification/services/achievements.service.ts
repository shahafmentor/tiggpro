import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement, UserAchievement, UserPoints } from '@/entities';
import { RequirementType } from '@tiggpro/shared';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(UserPoints)
    private userPointsRepository: Repository<UserPoints>,
  ) {}

  async checkAndAwardAchievements(
    userId: string,
    tenantId: string,
  ): Promise<UserAchievement[]> {
    const userPoints = await this.userPointsRepository.findOne({
      where: { userId, tenantId },
    });

    if (!userPoints) {
      return [];
    }

    // Get all active achievements
    const achievements = await this.achievementRepository.find({
      where: { isActive: true },
    });

    // Get user's existing achievements
    const existingAchievements = await this.userAchievementRepository.find({
      where: { userId, tenantId },
      select: ['achievementId'],
    });

    const existingIds = existingAchievements.map((ua) => ua.achievementId);
    const newAchievements: UserAchievement[] = [];

    for (const achievement of achievements) {
      // Skip if user already has this achievement
      if (existingIds.includes(achievement.id)) {
        continue;
      }

      // Check if user meets the requirement
      const meets = this.checkRequirement(achievement, userPoints);

      if (meets) {
        const userAchievement = this.userAchievementRepository.create({
          userId,
          achievementId: achievement.id,
          tenantId,
        });

        const saved =
          await this.userAchievementRepository.save(userAchievement);
        newAchievements.push(saved);
      }
    }

    return newAchievements;
  }

  async getUserAchievements(
    userId: string,
    tenantId: string,
  ): Promise<UserAchievement[]> {
    return this.userAchievementRepository.find({
      where: { userId, tenantId },
      relations: ['achievement'],
      order: { earnedAt: 'DESC' },
    });
  }

  async getAvailableAchievements(): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: { isActive: true },
      order: { requirementValue: 'ASC' },
    });
  }

  private checkRequirement(
    achievement: Achievement,
    userPoints: UserPoints,
  ): boolean {
    switch (achievement.requirementType) {
      case RequirementType.POINTS:
        return userPoints.totalPoints >= achievement.requirementValue;

      case RequirementType.STREAK:
        return userPoints.currentStreakDays >= achievement.requirementValue;

      case RequirementType.LEVEL:
        return userPoints.level >= achievement.requirementValue;

      case RequirementType.CHORES_COMPLETED:
        // This would require additional tracking - simplified for now
        // In a real implementation, you'd track completed chores count
        return userPoints.totalPoints >= achievement.requirementValue * 10; // Estimate

      default:
        return false;
    }
  }
}
