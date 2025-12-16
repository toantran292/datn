import { useEffect, useState, useCallback, useRef } from 'react';
import { NotificationClient } from '../utils/NotificationClient';
import type { UsePresenceOptions, PresenceEvent } from '../types';

export interface UsePresenceReturn {
  /**
   * Set of online user IDs
   */
  onlineUsers: Set<string>;

  /**
   * Check if a specific user is online
   */
  isUserOnline: (userId: string) => boolean;

  /**
   * Loading state for initial fetch
   */
  isLoading: boolean;

  /**
   * Connection state
   */
  isConnected: boolean;

  /**
   * Manually refresh online users list
   */
  refresh: () => Promise<void>;

  /**
   * Get online status for specific users
   */
  getUsersStatus: (userIds: string[]) => Promise<Record<string, boolean>>;
}

/**
 * React hook for real-time presence tracking
 *
 * @example
 * ```tsx
 * function MembersList() {
 *   const { onlineUsers, isUserOnline, isLoading } = usePresence({
 *     gatewayUrl: 'http://localhost:8080',
 *     userId: currentUser.id,
 *     orgId: currentOrg.id,
 *   });
 *
 *   return (
 *     <div>
 *       {members.map(member => (
 *         <div key={member.id}>
 *           {member.name}
 *           {isUserOnline(member.id) && <span className="online-badge" />}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePresence(options: UsePresenceOptions): UsePresenceReturn {
  const { gatewayUrl, userId, orgId, debug = false } = options;

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const clientRef = useRef<NotificationClient | null>(null);

  // Initialize client and connect when userId/orgId changes
  useEffect(() => {
    if (!gatewayUrl || !userId || !orgId) return;

    // Create new client instance
    const client = new NotificationClient({ gatewayUrl, debug });
    clientRef.current = client;

    // Connect with orgId
    client.connect(userId, orgId);

    // Handle connection
    const unsubConnect = client.onConnect(() => {
      setIsConnected(true);
      if (debug) console.log('[usePresence] Connected, fetching online users for org:', orgId);

      // Fetch initial online users
      client
        .getOnlineUsers()
        .then((users) => {
          if (debug) console.log('[usePresence] Got online users:', users);
          setOnlineUsers(new Set(users));
          setIsLoading(false);
        })
        .catch((err) => {
          if (debug) console.error('[usePresence] Failed to get online users:', err);
          setIsLoading(false);
        });
    });

    // Handle disconnection
    const unsubDisconnect = client.onDisconnect(() => {
      setIsConnected(false);
    });

    // Handle user online event
    const unsubOnline = client.onUserOnline((event: PresenceEvent) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(event.userId);
        return next;
      });
    });

    // Handle user offline event
    const unsubOffline = client.onUserOffline((event: PresenceEvent) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(event.userId);
        return next;
      });
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubOnline();
      unsubOffline();
      client.disconnect();
    };
  }, [gatewayUrl, userId, orgId, debug]);

  // Check if user is online
  const isUserOnline = useCallback(
    (id: string) => onlineUsers.has(id),
    [onlineUsers]
  );

  // Refresh online users list
  const refresh = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !isConnected) return;

    setIsLoading(true);
    try {
      const users = await client.getOnlineUsers();
      setOnlineUsers(new Set(users));
    } catch (err) {
      if (debug) console.error('[usePresence] Failed to refresh:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, debug]);

  // Get status for specific users
  const getUsersStatus = useCallback(
    async (userIds: string[]): Promise<Record<string, boolean>> => {
      const client = clientRef.current;
      if (!client || !isConnected) {
        // Return local state if not connected
        const result: Record<string, boolean> = {};
        userIds.forEach((id) => {
          result[id] = onlineUsers.has(id);
        });
        return result;
      }

      return client.getUsersStatus(userIds);
    },
    [isConnected, onlineUsers]
  );

  return {
    onlineUsers,
    isUserOnline,
    isLoading,
    isConnected,
    refresh,
    getUsersStatus,
  };
}
