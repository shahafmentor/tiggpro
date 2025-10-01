import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiDoc,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PointsService } from './services/points.service';
import { AchievementsService } from './services/achievements.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TenantMembershipGuard } from '@/auth/guards/tenant-membership.guard';
import type { ApiResponse as ApiResponseType } from '@tiggpro/shared';

@ApiTags('gamification')
@ApiBearerAuth()
@Controller('tenants/:tenantId/gamification')
@UseGuards(JwtAuthGuard, TenantMembershipGuard)
export class GamificationController {
  constructor(
    private readonly pointsService: PointsService,
    private readonly achievementsService: AchievementsService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get user gamification stats' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiDoc({ status: 200, description: 'User stats retrieved successfully' })
  async getUserStats(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponseType> {
    try {
      const stats = await this.pointsService.getUserStats(
        req.user.id,
        tenantId,
      );

      if (!stats) {
        return {
          success: true,
          data: {
            totalPoints: 0,
            availablePoints: 0,
            spentPoints: 0,
            currentStreakDays: 0,
            longestStreakDays: 0,
            level: 1,
          },
          message: 'User stats retrieved (new user)',
        };
      }

      return {
        success: true,
        data: {
          totalPoints: stats.totalPoints,
          availablePoints: stats.availablePoints,
          spentPoints: stats.spentPoints,
          currentStreakDays: stats.currentStreakDays,
          longestStreakDays: stats.longestStreakDays,
          level: stats.level,
          updatedAt: stats.updatedAt,
        },
        message: 'User stats retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get user stats',
      };
    }
  }

  @Get('leaderboard')
  async getTenantLeaderboard(
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponseType> {
    try {
      const leaderboard =
        await this.pointsService.getTenantLeaderboard(tenantId);

      return {
        success: true,
        data: leaderboard.map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          displayName: entry.user?.displayName || 'Unknown User',
          totalPoints: entry.totalPoints,
          level: entry.level,
          currentStreakDays: entry.currentStreakDays,
          longestStreakDays: entry.longestStreakDays,
        })),
        message: 'Leaderboard retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get leaderboard',
      };
    }
  }

  @Get('achievements')
  async getAvailableAchievements(): Promise<ApiResponseType> {
    try {
      const achievements =
        await this.achievementsService.getAvailableAchievements();

      return {
        success: true,
        data: achievements.map((achievement) => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          iconUrl: achievement.iconUrl,
          badgeColor: achievement.badgeColor,
          requirementType: achievement.requirementType,
          requirementValue: achievement.requirementValue,
          isActive: achievement.isActive,
        })),
        message: 'Available achievements retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get achievements',
      };
    }
  }

  @Get('achievements/earned')
  async getUserAchievements(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponseType> {
    try {
      const userAchievements =
        await this.achievementsService.getUserAchievements(
          req.user.id,
          tenantId,
        );

      return {
        success: true,
        data: userAchievements.map((userAchievement) => ({
          id: userAchievement.id,
          earnedAt: userAchievement.earnedAt,
          achievement: {
            id: userAchievement.achievement.id,
            name: userAchievement.achievement.name,
            description: userAchievement.achievement.description,
            iconUrl: userAchievement.achievement.iconUrl,
            badgeColor: userAchievement.achievement.badgeColor,
            requirementType: userAchievement.achievement.requirementType,
            requirementValue: userAchievement.achievement.requirementValue,
          },
        })),
        message: 'User achievements retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get user achievements',
      };
    }
  }
}
