import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChoresController } from './chores.controller';
import { ChoresService } from './chores.service';
import { AuthModule } from '@/auth/auth.module';
import { Chore, ChoreAssignment, TenantMember } from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chore, ChoreAssignment, TenantMember]),
    AuthModule, // For guards and auth service
  ],
  controllers: [ChoresController],
  providers: [ChoresService],
  exports: [ChoresService],
})
export class ChoresModule {}
