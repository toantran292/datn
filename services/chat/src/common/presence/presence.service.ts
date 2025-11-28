import { Injectable } from '@nestjs/common';

/**
 * Service to track online/offline status of users
 * Uses in-memory storage (for production, use Redis)
 */
@Injectable()
export class PresenceService {
  // Map<userId, Set<socketId>>
  private onlineUsers = new Map<string, Set<string>>();

  /**
   * Mark user as online (when socket connects)
   */
  userConnected(userId: string, socketId: string): boolean {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }

    const sockets = this.onlineUsers.get(userId)!;
    const wasOffline = sockets.size === 0;
    sockets.add(socketId);

    // Return true if user was offline before (để emit event)
    return wasOffline;
  }

  /**
   * Mark user as offline (when socket disconnects)
   */
  userDisconnected(userId: string, socketId: string): boolean {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return false;

    sockets.delete(socketId);

    // If no more sockets, user is fully offline
    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
      return true; // User is now offline (để emit event)
    }

    return false;
  }

  /**
   * Check if user is online
   */
  isOnline(userId: string): boolean {
    const sockets = this.onlineUsers.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  /**
   * Get online status for multiple users
   */
  getOnlineStatus(userIds: string[]): Map<string, boolean> {
    const status = new Map<string, boolean>();
    for (const userId of userIds) {
      status.set(userId, this.isOnline(userId));
    }
    return status;
  }
}

