"use client";

import { usePresenceManager, type UsePresenceManagerReturn } from "@uts/notifications";
import { useAppHeaderContext } from "./app-header-provider";

/**
 * Hook for real-time presence tracking within the current workspace.
 * Automatically uses the current user and workspace from AppHeaderContext.
 * Uses a singleton PresenceManager so all components share the same connection.
 *
 * @example
 * ```tsx
 * function MembersList() {
 *   const { onlineUsers, isUserOnline, isConnected } = useAppPresence();
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
export function useAppPresence(): UsePresenceManagerReturn & { enabled: boolean } {
  const { apiBaseUrl, auth, currentWorkspaceId } = useAppHeaderContext();

  const userId = auth?.user_id || "";
  const orgId = currentWorkspaceId || "";
  const enabled = !!(userId && orgId);

  const presence = usePresenceManager({
    gatewayUrl: apiBaseUrl,
    userId,
    orgId,
    debug: process.env.NODE_ENV === "development",
  });

  return {
    ...presence,
    enabled,
  };
}

export type { UsePresenceManagerReturn as UsePresenceReturn };
