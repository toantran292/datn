import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { InAppNotificationPayload } from '../types/notification.types';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  path: '/notifications/socket.io',
  namespace: '/',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove socket from user mapping
    this.userSockets.forEach((sockets, userId) => {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        this.logger.log(`Removed socket ${client.id} from user ${userId}`);
      }
    });
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    if (!userId) {
      this.logger.warn(`Client ${client.id} attempted to register without userId`);
      return { event: 'error', data: { message: 'userId is required' } };
    }

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }

    this.userSockets.get(userId).add(client.id);
    client.join(`user:${userId}`);

    this.logger.log(`Client ${client.id} registered for user ${userId}`);

    return {
      event: 'registered',
      data: {
        message: 'Successfully registered for notifications',
        userId,
      },
    };
  }

  @SubscribeMessage('unregister')
  handleUnregister(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(client.id);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }

    client.leave(`user:${userId}`);

    this.logger.log(`Client ${client.id} unregistered from user ${userId}`);

    return {
      event: 'unregistered',
      data: { message: 'Successfully unregistered', userId },
    };
  }

  /**
   * Send notification to a specific user
   * This method is called by the NotificationService
   */
  sendToUser(userId: string, notification: InAppNotificationPayload) {
    const room = `user:${userId}`;
    const socketsCount = this.userSockets.get(userId)?.size || 0;

    this.server.to(room).emit('notification', {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...notification,
      timestamp: new Date(),
    });

    this.logger.log(
      `Notification sent to user ${userId} (${socketsCount} active sockets)`,
    );
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcast(notification: any) {
    this.server.emit('broadcast', {
      id: `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...notification,
      timestamp: new Date(),
    });

    this.logger.log(
      `Broadcast notification sent to all clients (${this.server.sockets.sockets.size} sockets)`,
    );
  }

  /**
   * Get active users count
   */
  getActiveUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get total connections count
   */
  getTotalConnectionsCount(): number {
    return this.server.sockets.sockets.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }
}
