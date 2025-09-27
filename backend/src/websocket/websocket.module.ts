import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/auth/auth.module';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketController } from './websocket.controller';
import { RealtimeEventsService } from './realtime-events.service';
import { TenantMember } from '@/entities/tenant-member.entity';
import { User } from '@/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantMember, User]),
    AuthModule, // Import AuthModule which provides the correct JWT configuration
  ],
  controllers: [WebSocketController],
  providers: [WebSocketGateway, RealtimeEventsService],
  exports: [RealtimeEventsService],
})
export class WebSocketModule {}