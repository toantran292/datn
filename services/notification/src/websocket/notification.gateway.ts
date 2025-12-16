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
import { PresenceService } from '../presence/presence.service';

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

  constructor(private readonly presenceService: PresenceService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Handle presence disconnect
    const { isFullyOffline, userId, orgId } =
      this.presenceService.userDisconnected(client.id);

    if (isFullyOffline && userId && orgId) {
      // Broadcast user:offline to org room
      this.server.to(`org:${orgId}`).emit('user:offline', {
        userId,
        orgId,
        timestamp: new Date(),
      });
      this.logger.log(`Broadcasted user:offline for ${userId} to org ${orgId}`);
    }

    // Legacy cleanup (for backward compatibility)
    this.userSockets.forEach((sockets, uid) => {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(uid);
        }
        this.logger.log(`Removed socket ${client.id} from user ${uid}`);
      }
    });
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userId: string; orgId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, orgId } = data;

    if (!userId) {
      this.logger.warn(`Client ${client.id} attempted to register without userId`);
      return { event: 'error', data: { message: 'userId is required' } };
    }

    // Legacy user socket tracking
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(client.id);
    client.join(`user:${userId}`);

    // Handle presence with org
    if (orgId) {
      const { isFirstConnection } = this.presenceService.userConnected(
        userId,
        orgId,
        client.id,
      );

      // Join org room for presence events
      client.join(`org:${orgId}`);

      if (isFirstConnection) {
        // Broadcast user:online to org room
        this.server.to(`org:${orgId}`).emit('user:online', {
          userId,
          orgId,
          timestamp: new Date(),
        });
        this.logger.log(`Broadcasted user:online for ${userId} to org ${orgId}`);
      }
    }

    this.logger.log(
      `Client ${client.id} registered for user ${userId}${orgId ? ` in org ${orgId}` : ''}`,
    );

    return {
      event: 'registered',
      data: {
        message: 'Successfully registered for notifications',
        userId,
        orgId,
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
    return this.presenceService.getOnlineUsersCount();
  }

  /**
   * Get total connections count
   */
  getTotalConnectionsCount(): number {
    return this.presenceService.getTotalConnectionsCount();
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.presenceService.isOnline(userId);
  }

  /**
   * Get online users in an organization
   */
  getOnlineUsersInOrg(orgId: string): string[] {
    return this.presenceService.getOnlineUsersInOrg(orgId);
  }

  /**
   * Get online status for multiple users
   */
  getOnlineStatus(userIds: string[]): Map<string, boolean> {
    return this.presenceService.getOnlineStatus(userIds);
  }

  /**
   * Subscribe to presence events - get online users for an org
   * Emits response event and returns for acknowledgement callback
   */
  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers(
    @MessageBody() data: { orgId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { orgId } = data;

    if (!orgId) {
      this.logger.warn('get_online_users called without orgId');
      client.emit('online_users_response', { error: 'orgId is required', users: [] });
      return { event: 'error', data: { message: 'orgId is required' } };
    }

    const onlineUsers = this.presenceService.getOnlineUsersInOrg(orgId);

    this.logger.log(`Get online users for org ${orgId}: ${onlineUsers.length} users - ${JSON.stringify(onlineUsers)}`);

    // Emit response event to client (primary method)
    client.emit('online_users_response', {
      orgId,
      users: onlineUsers,
      timestamp: new Date(),
    });

    // Also return for acknowledgement callback (backup)
    return {
      event: 'online_users',
      data: {
        orgId,
        users: onlineUsers,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Get online status for specific users
   */
  @SubscribeMessage('get_users_status')
  handleGetUsersStatus(
    @MessageBody() data: { userIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const { userIds } = data;

    if (!userIds || userIds.length === 0) {
      return { event: 'error', data: { message: 'userIds is required' } };
    }

    const statusMap = this.presenceService.getOnlineStatus(userIds);
    const statuses = Object.fromEntries(statusMap);

    return {
      event: 'users_status',
      data: {
        statuses,
        timestamp: new Date(),
      },
    };
  }
}
