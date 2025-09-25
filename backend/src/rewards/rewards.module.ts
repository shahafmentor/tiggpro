import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { RewardSettingsService } from './settings.service';
import { RewardRedemption, RewardSettings, UserPoints } from '@/entities';
import { TenantsModule } from '@/tenants/tenants.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([RewardRedemption, RewardSettings, UserPoints]), TenantsModule, AuthModule],
  controllers: [RewardsController],
  providers: [RewardsService, RewardSettingsService],
  exports: [RewardsService, RewardSettingsService],
})
export class RewardsModule {}


