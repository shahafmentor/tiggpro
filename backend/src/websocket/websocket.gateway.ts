import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantMember } from '@/entities/tenant-member.entity';
import { User } from '@/entities/user.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantIds?: string[];
  userEmail?: string;
}

interface RealTimeEvent {
  type: string;
  tenantId: string;
  data: Record<string, unknown> | unknown;
  timestamp: string;
  excludeUserId?: string;
}

@Injectable()
@WSGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://frontend:3000', // Docker internal
      'http://localhost:3000', // Local development
    ],
    credentials: true,
  },
  namespace: '/realtime',
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private userSocketMap = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(TenantMember)
    private readonly tenantMemberRepository: Repository<TenantMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractTokenFromHandshake(client);
      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect(true);
        return;
      }

      const payload = await this.validateToken(token);
      if (!payload) {
        this.logger.warn('Connection rejected: Invalid token');
        client.disconnect(true);
        return;
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        this.logger.warn('Connection rejected: User not found');
        client.disconnect(true);
        return;
      }

      const tenantMemberships = await this.tenantMemberRepository.find({
        where: { userId: user.id },
        relations: ['tenant'],
      });

      client.userId = user.id;
      client.userEmail = user.email;
      client.tenantIds = tenantMemberships.map((tm) => tm.tenantId);

      this.addUserSocket(user.id, client.id);

      for (const tenantId of client.tenantIds) {
        await client.join(`tenant:${tenantId}`);
      }

      this.logger.log(
        `User ${user.email} connected to tenants: ${client.tenantIds.join(', ')}`,
      );

      client.emit('connection:success', {
        userId: user.id,
        tenantIds: client.tenantIds,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error during connection:', error);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.removeUserSocket(client.userId, client.id);
      this.logger.log(`User ${client.userEmail} disconnected`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  emitToTenant(event: RealTimeEvent) {
    const room = `tenant:${event.tenantId}`;

    if (event.excludeUserId) {
      const userSockets = this.userSocketMap.get(event.excludeUserId);
      if (userSockets) {
        this.server
          .to(room)
          .except([...userSockets])
          .emit('realtime:event', {
            type: event.type,
            data: event.data,
            timestamp: event.timestamp,
          });
      } else {
        this.server.to(room).emit('realtime:event', {
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
        });
      }
    } else {
      this.server.to(room).emit('realtime:event', {
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
      });
    }

    this.logger.log(
      `Emitted ${event.type} to tenant ${event.tenantId}${
        event.excludeUserId ? ` (excluding ${event.excludeUserId})` : ''
      }`,
    );
  }

  emitToUser(
    userId: string,
    event: { type: string; data: Record<string, unknown> },
  ) {
    const userSockets = this.userSocketMap.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        this.server.to(socketId).emit('realtime:event', {
          type: event.type,
          data: event.data,
          timestamp: new Date().toISOString(),
        });
      }
      this.logger.log(`Emitted ${event.type} to user ${userId}`);
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const token =
      client.handshake.auth?.token || client.handshake.headers?.authorization;

    if (typeof token === 'string') {
      return token.startsWith('Bearer ') ? token.slice(7) : token;
    }

    return null;
  }

  private async validateToken(token: string): Promise<{ sub: string } | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(token);
      return payload as { sub: string };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Token validation failed:', error.message);
      }
      return null;
    }
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, new Set());
    }
    this.userSocketMap.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const userSockets = this.userSocketMap.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.userSocketMap.delete(userId);
      }
    }
  }
}
