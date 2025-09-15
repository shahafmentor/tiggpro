import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationController } from './gamification.controller';
import { PointsService } from './services/points.service';
import { AchievementsService } from './services/achievements.service';
import { AuthModule } from '@/auth/auth.module';
import { UserPoints, Achievement, UserAchievement } from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPoints, Achievement, UserAchievement]),
    AuthModule, // For guards
  ],
  controllers: [GamificationController],
  providers: [PointsService, AchievementsService],
  exports: [PointsService, AchievementsService],
})
export class GamificationModule {}
