export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  timestamp: Date | string;
  read?: boolean;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date | string;
}

export interface NotificationConfig {
  /**
   * API Gateway URL (e.g., 'http://localhost:8080')
   * Should point to your edge/gateway service
   */
  gatewayUrl: string;

  /**
   * Enable auto-reconnection on disconnect
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Reconnection delay in milliseconds
   * @default 1000
   */
  reconnectionDelay?: number;

  /**
   * Maximum reconnection attempts
   * @default Infinity
   */
  reconnectionAttempts?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Custom authentication token (optional)
   * Will be sent as query parameter or in handshake
   */
  authToken?: string;
}

export interface NotificationState {
  notifications: Notification[];
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
}

export type NotificationEventHandler = (notification: Notification) => void;
export type BroadcastEventHandler = (notification: BroadcastNotification) => void;
export type ConnectionEventHandler = () => void;
export type ErrorEventHandler = (error: Error) => void;

// Presence types
export interface PresenceEvent {
  userId: string;
  orgId: string;
  timestamp: Date | string;
}

export type PresenceEventHandler = (event: PresenceEvent) => void;

export interface PresenceState {
  onlineUsers: Set<string>;
  isLoading: boolean;
}

export interface UsePresenceOptions {
  /**
   * API Gateway URL
   */
  gatewayUrl: string;

  /**
   * User ID
   */
  userId: string;

  /**
   * Organization ID for presence tracking
   */
  orgId: string;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}
