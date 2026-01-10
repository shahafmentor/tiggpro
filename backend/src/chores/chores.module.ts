import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChoresController } from './chores.controller';
import { ChoresService } from './chores.service';
import { RecurrenceService } from './recurrence.service';
import { SchedulerService } from './scheduler.service';
import { AuthModule } from '@/auth/auth.module';
import { WebSocketModule } from '@/websocket/websocket.module';
import {
  Chore,
  ChoreAssignment,
  ChoreInstance,
  ChoreRecurrence,
  TenantMember,
  User,
} from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chore,
      ChoreInstance,
      ChoreAssignment,
      ChoreRecurrence,
      TenantMember,
      User,
    ]),
    AuthModule, // For guards and auth service
    WebSocketModule, // For real-time events
  ],
  controllers: [ChoresController],
  providers: [ChoresService, RecurrenceService, SchedulerService],
  exports: [ChoresService, RecurrenceService, SchedulerService],
})
export class ChoresModule {}
