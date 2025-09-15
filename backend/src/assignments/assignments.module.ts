import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { AuthModule } from '@/auth/auth.module';
import { GamificationModule } from '@/gamification/gamification.module';
import { ChoreAssignment, ChoreSubmission, TenantMember, Chore } from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChoreAssignment, ChoreSubmission, TenantMember, Chore]),
    AuthModule, // For guards and auth service
    GamificationModule, // For points and achievements
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
