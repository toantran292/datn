import { io, Socket } from 'socket.io-client';
import type {
  NotificationConfig,
  Notification,
  BroadcastNotification,
  NotificationEventHandler,
  BroadcastEventHandler,
  ConnectionEventHandler,
  ErrorEventHandler,
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

  // Event handlers
  private onNotificationHandlers: Set<NotificationEventHandler> = new Set();
  private onBroadcastHandlers: Set<BroadcastEventHandler> = new Set();
  private onConnectHandlers: Set<ConnectionEventHandler> = new Set();
  private onDisconnectHandlers: Set<ConnectionEventHandler> = new Set();
  private onErrorHandlers: Set<ErrorEventHandler> = new Set();

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
  connect(userId: string): void {
    if (this.socket?.connected) {
      this.log('Already connected');
      return;
    }

    this.userId = userId;

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

    this.log(`Connecting to ${this.config.gatewayUrl}/notifications`);

    this.socket = io(`${this.config.gatewayUrl}/notifications`, socketOptions);

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
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.log('Connected to notification service');

      // Register user
      if (this.userId) {
        this.socket!.emit('register', { userId: this.userId });
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
