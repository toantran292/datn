import { Injectable, Logger } from '@nestjs/common';

export interface UserPresence {
  userId: string;
  orgId: string;
  isOnline: boolean;
  lastSeen: Date;
  socketCount: number;
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  // userId -> Set<socketId>
  private userSockets: Map<string, Set<string>> = new Map();

  // socketId -> { userId, orgId }
  private socketInfo: Map<string, { userId: string; orgId: string }> = new Map();

  // userId -> orgId (primary org for presence)
  private userOrgs: Map<string, string> = new Map();

  // userId -> lastSeen timestamp
  private lastSeen: Map<string, Date> = new Map();

  /**
   * Register a user connection
   * @returns true if user was previously offline (first connection)
   */
  userConnected(
    userId: string,
    orgId: string,
    socketId: string,
  ): { isFirstConnection: boolean; previousOrgId?: string } {
    const wasOffline = !this.isOnline(userId);
    const previousOrgId = this.userOrgs.get(userId);

    // Update user sockets
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);

    // Store socket info
    this.socketInfo.set(socketId, { userId, orgId });

    // Update user's org (use the latest connection's org)
    this.userOrgs.set(userId, orgId);

    // Update last seen
    this.lastSeen.set(userId, new Date());

    this.logger.log(
      `User ${userId} connected from org ${orgId} (socket: ${socketId}, total: ${this.userSockets.get(userId)!.size})`,
    );

    return {
      isFirstConnection: wasOffline,
      previousOrgId: previousOrgId !== orgId ? previousOrgId : undefined,
    };
  }

  /**
   * Unregister a user connection
   * @returns true if user is now fully offline (last socket disconnected)
   */
  userDisconnected(socketId: string): {
    isFullyOffline: boolean;
    userId?: string;
    orgId?: string;
  } {
    const info = this.socketInfo.get(socketId);
    if (!info) {
      return { isFullyOffline: false };
    }

    const { userId, orgId } = info;

    // Remove socket from user's set
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socketId);

      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
        // Update last seen when going offline
        this.lastSeen.set(userId, new Date());

        this.logger.log(`User ${userId} is now offline`);

        // Clean up socket info
        this.socketInfo.delete(socketId);

        return { isFullyOffline: true, userId, orgId };
      }
    }

    // Clean up socket info
    this.socketInfo.delete(socketId);

    this.logger.log(
      `User ${userId} socket disconnected (remaining: ${userSocketSet?.size ?? 0})`,
    );

    return { isFullyOffline: false, userId, orgId };
  }

  /**
   * Check if user is online
   */
  isOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }

  /**
   * Get all online users in an organization
   */
  getOnlineUsersInOrg(orgId: string): string[] {
    const onlineUsers: string[] = [];

    this.userOrgs.forEach((userOrgId, userId) => {
      if (userOrgId === orgId && this.isOnline(userId)) {
        onlineUsers.push(userId);
      }
    });

    return onlineUsers;
  }

  /**
   * Get online status for multiple users
   */
  getOnlineStatus(userIds: string[]): Map<string, boolean> {
    const result = new Map<string, boolean>();
    userIds.forEach((userId) => {
      result.set(userId, this.isOnline(userId));
    });
    return result;
  }

  /**
   * Get user presence info
   */
  getUserPresence(userId: string): UserPresence | null {
    const orgId = this.userOrgs.get(userId);
    if (!orgId) return null;

    return {
      userId,
      orgId,
      isOnline: this.isOnline(userId),
      lastSeen: this.lastSeen.get(userId) ?? new Date(),
      socketCount: this.userSockets.get(userId)?.size ?? 0,
    };
  }

  /**
   * Get org ID for a user
   */
  getUserOrgId(userId: string): string | undefined {
    return this.userOrgs.get(userId);
  }

  /**
   * Get all online users count
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get total socket connections count
   */
  getTotalConnectionsCount(): number {
    return this.socketInfo.size;
  }
}
