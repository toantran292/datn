import { useEffect, useState, useCallback, useRef } from 'react';
import { NotificationClient } from '../utils/NotificationClient';
import type { NotificationConfig } from '../types';

export interface UseNotificationConnectionOptions extends NotificationConfig {
  /**
   * User ID to register for notifications
   */
  userId: string;

  /**
   * Auto-connect on mount
   * @default true
   */
  autoConnect?: boolean;
}

export interface UseNotificationConnectionReturn {
  /**
   * Whether connected to notification service
   */
  isConnected: boolean;

  /**
   * Whether currently connecting
   */
  isConnecting: boolean;

  /**
   * Connection error if any
   */
  error: Error | null;

  /**
   * Manually connect
   */
  connect: () => void;

  /**
   * Disconnect
   */
  disconnect: () => void;

  /**
   * Get the underlying client instance
   */
  client: NotificationClient | null;
}

/**
 * Hook for managing WebSocket connection only
 * Use this if you want to handle notifications manually
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, client } = useNotificationConnection({
 *     gatewayUrl: 'http://localhost:8080',
 *     userId: 'user-123',
 *   });
 *
 *   useEffect(() => {
 *     if (!client) return;
 *
 *     const unsub = client.onNotification((notif) => {
 *       console.log('Got notification:', notif);
 *     });
 *
 *     return unsub;
 *   }, [client]);
 *
 *   return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export function useNotificationConnection(
  options: UseNotificationConnectionOptions
): UseNotificationConnectionReturn {
  const { userId, autoConnect = true, ...clientConfig } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef<NotificationClient | null>(null);

  // Initialize client
  useEffect(() => {
    clientRef.current = new NotificationClient(clientConfig);

    return () => {
      clientRef.current?.disconnect();
    };
  }, [clientConfig.gatewayUrl]);

  const connect = useCallback(() => {
    if (!clientRef.current || !userId) return;

    setIsConnecting(true);
    setError(null);
    clientRef.current.connect(userId);
  }, [userId]);

  const disconnect = useCallback(() => {
    if (!clientRef.current) return;
    clientRef.current.disconnect();
  }, []);

  // Setup connection event listeners
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    const unsubConnect = client.onConnect(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    const unsubDisconnect = client.onDisconnect(() => {
      setIsConnected(false);
      setIsConnecting(false);
    });

    const unsubError = client.onError((err) => {
      setError(err);
      setIsConnecting(false);
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubError();
    };
  }, []);

  // Auto-connect
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    client: clientRef.current,
  };
}
