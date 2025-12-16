import { io, Socket } from 'socket.io-client';
import type {
  NotificationConfig,
  Notification,
  BroadcastNotification,
  NotificationEventHandler,
  BroadcastEventHandler,
  ConnectionEventHandler,
  ErrorEventHandler,
  PresenceEvent,
  PresenceEventHandler,
} from '../types';

/**
 * WebSocket client for connecting to notification service via API Gateway
 */
export class NotificationClient {
  private socket: Socket | null = null;
  private config: NotificationConfig & {
    autoReconnect: boolean;
    reconnectionDelay: number;
    reconnectionAttempts: number;
    debug: boolean;
  };
  private userId: string | null = null;
  private orgId: string | null = null;

  // Event handlers
  private onNotificationHandlers: Set<NotificationEventHandler> = new Set();
  private onBroadcastHandlers: Set<BroadcastEventHandler> = new Set();
  private onConnectHandlers: Set<ConnectionEventHandler> = new Set();
  private onDisconnectHandlers: Set<ConnectionEventHandler> = new Set();
  private onErrorHandlers: Set<ErrorEventHandler> = new Set();
  private onUserOnlineHandlers: Set<PresenceEventHandler> = new Set();
  private onUserOfflineHandlers: Set<PresenceEventHandler> = new Set();

  constructor(config: NotificationConfig) {
    this.config = {
      autoReconnect: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      debug: false,
      ...config,
    };
  }

  /**
   * Connect to notification service
   */
  connect(userId: string, orgId?: string): void {
    if (this.socket?.connected) {
      this.log('Already connected');
      return;
    }

    this.userId = userId;
    this.orgId = orgId || null;

    const socketOptions: any = {
      path: '/notifications/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: this.config.autoReconnect,
      reconnectionDelay: this.config.reconnectionDelay,
      reconnectionAttempts: this.config.reconnectionAttempts,
    };

    // Add auth token if provided
    if (this.config.authToken) {
      socketOptions.auth = {
        token: this.config.authToken,
      };
    }

    this.log(`Connecting to ${this.config.gatewayUrl}`);

    // Connect to gateway URL, Socket.IO path handles the routing
    this.socket = io(this.config.gatewayUrl, socketOptions);

    this.setupEventListeners();
  }

  /**
   * Disconnect from notification service
   */
  disconnect(): void {
    if (!this.socket) return;

    if (this.userId) {
      this.socket.emit('unregister', { userId: this.userId });
    }

    this.socket.close();
    this.socket = null;
    this.userId = null;
    this.orgId = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Register event handlers
   */
  onNotification(handler: NotificationEventHandler): () => void {
    this.onNotificationHandlers.add(handler);
    return () => this.onNotificationHandlers.delete(handler);
  }

  onBroadcast(handler: BroadcastEventHandler): () => void {
    this.onBroadcastHandlers.add(handler);
    return () => this.onBroadcastHandlers.delete(handler);
  }

  onConnect(handler: ConnectionEventHandler): () => void {
    this.onConnectHandlers.add(handler);
    return () => this.onConnectHandlers.delete(handler);
  }

  onDisconnect(handler: ConnectionEventHandler): () => void {
    this.onDisconnectHandlers.add(handler);
    return () => this.onDisconnectHandlers.delete(handler);
  }

  onError(handler: ErrorEventHandler): () => void {
    this.onErrorHandlers.add(handler);
    return () => this.onErrorHandlers.delete(handler);
  }

  /**
   * Register handler for user online events
   */
  onUserOnline(handler: PresenceEventHandler): () => void {
    this.onUserOnlineHandlers.add(handler);
    return () => this.onUserOnlineHandlers.delete(handler);
  }

  /**
   * Register handler for user offline events
   */
  onUserOffline(handler: PresenceEventHandler): () => void {
    this.onUserOfflineHandlers.add(handler);
    return () => this.onUserOfflineHandlers.delete(handler);
  }

  /**
   * Get online users in the current org
   * Uses event-based response since NestJS acknowledgement may have issues
   */
  getOnlineUsers(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.orgId) {
        reject(new Error('Not connected or no orgId'));
        return;
      }

      this.log('Requesting online users for org:', this.orgId);

      // Set up one-time listener for response
      const responseHandler = (response: any) => {
        clearTimeout(timeout);
        this.log('Got online_users_response:', response);
        const users = response?.users || [];
        resolve(users);
      };

      // Timeout after 5 seconds
      const timeout = setTimeout(() => {
        this.socket?.off('online_users_response', responseHandler);
        this.log('getOnlineUsers timeout - no response received');
        resolve([]); // Resolve with empty array on timeout
      }, 5000);

      // Listen for response event
      this.socket.once('online_users_response', responseHandler);

      // Also try callback style (in case NestJS supports it)
      this.socket.emit('get_online_users', { orgId: this.orgId }, (response: any) => {
        if (response) {
          clearTimeout(timeout);
          this.socket?.off('online_users_response', responseHandler);
          this.log('Got online users via callback:', response);
          if (response?.event === 'error') {
            reject(new Error(response.data?.message || 'Unknown error'));
          } else {
            const users = response?.data?.users || [];
            this.log('Parsed online users:', users);
            resolve(users);
          }
        }
      });
    });
  }

  /**
   * Get online status for specific users
   */
  getUsersStatus(userIds: string[]): Promise<Record<string, boolean>> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('get_users_status', { userIds }, (response: any) => {
        if (response.event === 'error') {
          reject(new Error(response.data.message));
        } else {
          resolve(response.data.statuses || {});
        }
      });
    });
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.log('Connected to notification service');

      // Register user with orgId for presence tracking
      if (this.userId) {
        this.socket!.emit('register', { userId: this.userId, orgId: this.orgId });
      }

      this.onConnectHandlers.forEach((handler) => handler());
    });

    this.socket.on('registered', (data: any) => {
      this.log('Registered for notifications:', data);
    });

    this.socket.on('notification', (notification: Notification) => {
      this.log('Received notification:', notification);
      this.onNotificationHandlers.forEach((handler) => handler(notification));
    });

    this.socket.on('broadcast', (notification: BroadcastNotification) => {
      this.log('Received broadcast:', notification);
      this.onBroadcastHandlers.forEach((handler) => handler(notification));
    });

    this.socket.on('disconnect', (reason: string) => {
      this.log('Disconnected:', reason);
      this.onDisconnectHandlers.forEach((handler) => handler());
    });

    this.socket.on('error', (error: any) => {
      this.log('Socket error:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      this.onErrorHandlers.forEach((handler) => handler(err));
    });

    this.socket.on('connect_error', (error: Error) => {
      this.log('Connection error:', error);
      this.onErrorHandlers.forEach((handler) => handler(error));
    });

    // Presence events
    this.socket.on('user:online', (event: PresenceEvent) => {
      this.log('User online:', event);
      this.onUserOnlineHandlers.forEach((handler) => handler(event));
    });

    this.socket.on('user:offline', (event: PresenceEvent) => {
      this.log('User offline:', event);
      this.onUserOfflineHandlers.forEach((handler) => handler(event));
    });
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[NotificationClient]', ...args);
    }
  }
}
