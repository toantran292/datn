import { useEffect, useState, useCallback } from 'react';
import { PresenceManager } from '../utils/PresenceManager';

export interface UsePresenceManagerOptions {
  gatewayUrl: string;
  userId: string;
  orgId: string;
  debug?: boolean;
}

export interface UsePresenceManagerReturn {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
  isConnected: boolean;
  isConnecting: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for using the singleton PresenceManager
 * All components using this hook share the same connection and state
 */
export function usePresenceManager(
  options: UsePresenceManagerOptions
): UsePresenceManagerReturn {
  const { gatewayUrl, userId, orgId, debug = false } = options;

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(
    PresenceManager.getOnlineUsers()
  );
  const [status, setStatus] = useState(PresenceManager.getStatus());

  // Initialize and connect
  useEffect(() => {
    if (!userId || !orgId) return;

    // Initialize with config
    PresenceManager.initialize({ gatewayUrl, debug });

    // Subscribe to changes
    const unsubscribe = PresenceManager.subscribe((users) => {
      setOnlineUsers(users);
      setStatus(PresenceManager.getStatus());
    });

    // Connect
    PresenceManager.connect(userId, orgId).catch((error) => {
      if (debug) {
        console.error('[usePresenceManager] Connection failed:', error);
      }
    });

    // Update status after connection attempt
    setStatus(PresenceManager.getStatus());

    return () => {
      unsubscribe();
      // Note: We don't disconnect here because other components may still be using it
    };
  }, [gatewayUrl, userId, orgId, debug]);

  // Check if user is online
  const isUserOnline = useCallback(
    (id: string) => onlineUsers.has(id),
    [onlineUsers]
  );

  // Refresh online users
  const refresh = useCallback(async () => {
    await PresenceManager.refresh();
  }, []);

  return {
    onlineUsers,
    isUserOnline,
    isConnected: status.isConnected,
    isConnecting: status.isConnecting,
    refresh,
  };
}
