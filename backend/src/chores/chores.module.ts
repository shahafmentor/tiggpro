import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChoresController } from './chores.controller';
import { ChoresService } from './chores.service';
import { AuthModule } from '@/auth/auth.module';
import { WebSocketModule } from '@/websocket/websocket.module';
import {
  Chore,
  ChoreAssignment,
  ChoreInstance,
  TenantMember,
  User,
} from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chore,
      ChoreInstance,
      ChoreAssignment,
      TenantMember,
      User,
    ]),
    AuthModule, // For guards and auth service
    WebSocketModule, // For real-time events
  ],
  controllers: [ChoresController],
  providers: [ChoresService],
  exports: [ChoresService],
})
export class ChoresModule {}
