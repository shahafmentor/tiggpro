import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { AuthModule } from '@/auth/auth.module';
import { GamificationModule } from '@/gamification/gamification.module';
import { WebSocketModule } from '@/websocket/websocket.module';
import {
  ChoreAssignment,
  ChoreSubmission,
  ChoreInstance,
  TenantMember,
  Chore,
  User,
} from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChoreAssignment,
      ChoreSubmission,
      ChoreInstance,
      TenantMember,
      Chore,
      User,
    ]),
    AuthModule, // For guards and auth service
    GamificationModule, // For points and achievements
    WebSocketModule, // For real-time events
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
