import { useEffect, useState, useCallback, useRef } from 'react';
import { NotificationClient } from '../utils/NotificationClient';
import type {
  NotificationConfig,
  Notification,
  BroadcastNotification,
  NotificationState,
} from '../types';

export interface UseNotificationsOptions extends NotificationConfig {
  /**
   * User ID to register for notifications
   */
  userId: string;

  /**
   * Maximum number of notifications to keep in state
   * @default 50
   */
  maxNotifications?: number;

  /**
   * Auto-connect on mount
   * @default true
   */
  autoConnect?: boolean;
}

export interface UseNotificationsReturn extends NotificationState {
  /**
   * Manually connect to notification service
   */
  connect: () => void;

  /**
   * Disconnect from notification service
   */
  disconnect: () => void;

  /**
   * Mark notification as read
   */
  markAsRead: (notificationId: string) => void;

  /**
   * Clear all notifications
   */
  clearAll: () => void;

  /**
   * Remove specific notification
   */
  remove: (notificationId: string) => void;

  /**
   * Get unread count
   */
  unreadCount: number;
}

/**
 * React hook for real-time notifications
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     notifications,
 *     isConnected,
 *     unreadCount,
 *     markAsRead,
 *     clearAll,
 *   } = useNotifications({
 *     gatewayUrl: 'http://localhost:8080',
 *     userId: 'user-123',
 *     debug: true,
 *   });
 *
 *   return (
 *     <div>
 *       <h2>Notifications ({unreadCount})</h2>
 *       {notifications.map((notif) => (
 *         <div key={notif.id} onClick={() => markAsRead(notif.id)}>
 *           <h3>{notif.title}</h3>
 *           <p>{notif.message}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotifications(
  options: UseNotificationsOptions
): UseNotificationsReturn {
  const {
    userId,
    maxNotifications = 50,
    autoConnect = true,
    ...clientConfig
  } = options;

  const [state, setState] = useState<NotificationState>({
    notifications: [],
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const clientRef = useRef<NotificationClient | null>(null);

  // Initialize client
  useEffect(() => {
    clientRef.current = new NotificationClient(clientConfig);

    return () => {
      clientRef.current?.disconnect();
    };
  }, [clientConfig.gatewayUrl]);

  // Connect/disconnect logic
  const connect = useCallback(() => {
    if (!clientRef.current || !userId) return;

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    clientRef.current.connect(userId);
  }, [userId]);

  const disconnect = useCallback(() => {
    if (!clientRef.current) return;
    clientRef.current.disconnect();
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, connect, disconnect]);

  // Setup event listeners
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    // Handle connection
    const unsubConnect = client.onConnect(() => {
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
      }));
    });

    // Handle disconnection
    const unsubDisconnect = client.onDisconnect(() => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));
    });

    // Handle errors
    const unsubError = client.onError((error) => {
      setState((prev) => ({
        ...prev,
        error,
        isConnecting: false,
      }));
    });

    // Handle notifications
    const unsubNotification = client.onNotification((notification) => {
      setState((prev) => {
        const newNotifications = [
          { ...notification, read: false },
          ...prev.notifications,
        ].slice(0, maxNotifications);

        return {
          ...prev,
          notifications: newNotifications,
        };
      });
    });

    // Handle broadcasts
    const unsubBroadcast = client.onBroadcast((broadcast) => {
      setState((prev) => {
        const notification: Notification = {
          ...broadcast,
          read: false,
        };

        const newNotifications = [
          notification,
          ...prev.notifications,
        ].slice(0, maxNotifications);

        return {
          ...prev,
          notifications: newNotifications,
        };
      });
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubError();
      unsubNotification();
      unsubBroadcast();
    };
  }, [maxNotifications]);

  // Mark as read
  const markAsRead = useCallback((notificationId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: [],
    }));
  }, []);

  // Remove specific notification
  const remove = useCallback((notificationId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== notificationId),
    }));
  }, []);

  // Calculate unread count
  const unreadCount = state.notifications.filter((n) => !n.read).length;

  return {
    ...state,
    connect,
    disconnect,
    markAsRead,
    clearAll,
    remove,
    unreadCount,
  };
}
