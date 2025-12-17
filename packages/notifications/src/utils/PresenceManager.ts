import { NotificationClient } from './NotificationClient';
import type { PresenceEvent } from '../types';

export interface PresenceManagerConfig {
  gatewayUrl: string;
  debug?: boolean;
}

export type PresenceChangeHandler = (onlineUsers: Set<string>) => void;

/**
 * Singleton manager for presence tracking
 * Shares a single WebSocket connection across all components
 */
class PresenceManagerClass {
  private client: NotificationClient | null = null;
  private onlineUsers: Set<string> = new Set();
  private listeners: Set<PresenceChangeHandler> = new Set();
  private config: PresenceManagerConfig | null = null;
  private userId: string | null = null;
  private orgId: string | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  /**
   * Initialize the presence manager with config
   */
  initialize(config: PresenceManagerConfig): void {
    if (this.config?.gatewayUrl === config.gatewayUrl) {
      return; // Already initialized with same config
    }

    this.config = config;
    this.log('Initialized with config:', config);
  }

  /**
   * Connect with user and org credentials
   */
  async connect(userId: string, orgId: string): Promise<void> {
    if (!this.config) {
      throw new Error('PresenceManager not initialized. Call initialize() first.');
    }

    // If already connected with same credentials, return
    if (this.isConnected && this.userId === userId && this.orgId === orgId) {
      this.log('Already connected with same credentials');
      return;
    }

    // If connecting, wait for existing connection
    if (this.isConnecting && this.connectionPromise) {
      await this.connectionPromise;
      return;
    }

    // Disconnect existing connection if credentials changed
    if (this.client && (this.userId !== userId || this.orgId !== orgId)) {
      this.log('Credentials changed, disconnecting existing connection');
      this.disconnect();
    }

    this.userId = userId;
    this.orgId = orgId;
    this.isConnecting = true;

    this.connectionPromise = this.doConnect();
    await this.connectionPromise;
  }

  private async doConnect(): Promise<void> {
    try {
      this.client = new NotificationClient({
        gatewayUrl: this.config!.gatewayUrl,
        debug: this.config!.debug,
      });

      // Setup event handlers before connecting
      this.setupEventHandlers();

      // Connect
      this.client.connect(this.userId!, this.orgId!);

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        const unsubConnect = this.client!.onConnect(() => {
          clearTimeout(timeout);
          unsubConnect();
          resolve();
        });

        const unsubError = this.client!.onError((error) => {
          clearTimeout(timeout);
          unsubError();
          reject(error);
        });
      });

      this.isConnected = true;
      this.isConnecting = false;
      this.log('Connected successfully');

      // Fetch initial online users
      await this.fetchOnlineUsers();
    } catch (error) {
      this.isConnecting = false;
      this.log('Connection failed:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.onUserOnline((event: PresenceEvent) => {
      this.log('User online:', event.userId);
      this.onlineUsers.add(event.userId);
      this.notifyListeners();
    });

    this.client.onUserOffline((event: PresenceEvent) => {
      this.log('User offline:', event.userId);
      this.onlineUsers.delete(event.userId);
      this.notifyListeners();
    });

    this.client.onDisconnect(() => {
      this.log('Disconnected');
      this.isConnected = false;
    });
  }

  private async fetchOnlineUsers(): Promise<void> {
    if (!this.client || !this.orgId) return;

    try {
      this.log('Fetching online users for org:', this.orgId);
      const users = await this.client.getOnlineUsers();
      this.log('Fetched online users:', users);
      this.onlineUsers = new Set(users);
      this.notifyListeners();
    } catch (error) {
      this.log('Failed to fetch online users:', error);
    }
  }

  /**
   * Disconnect from presence service
   */
  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.onlineUsers.clear();
    this.userId = null;
    this.orgId = null;
    this.connectionPromise = null;
    this.log('Disconnected and cleaned up');
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): Set<string> {
    return new Set(this.onlineUsers);
  }

  /**
   * Subscribe to presence changes
   */
  subscribe(handler: PresenceChangeHandler): () => void {
    this.listeners.add(handler);
    // Immediately call with current state
    handler(this.getOnlineUsers());
    return () => this.listeners.delete(handler);
  }

  /**
   * Get connection status
   */
  getStatus(): { isConnected: boolean; isConnecting: boolean } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
    };
  }

  /**
   * Refresh online users list
   */
  async refresh(): Promise<void> {
    await this.fetchOnlineUsers();
  }

  private notifyListeners(): void {
    const users = this.getOnlineUsers();
    this.listeners.forEach((handler) => handler(users));
  }

  private log(...args: any[]): void {
    if (this.config?.debug) {
      console.log('[PresenceManager]', ...args);
    }
  }
}

// Export singleton instance
export const PresenceManager = new PresenceManagerClass();
