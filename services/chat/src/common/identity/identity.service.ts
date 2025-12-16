import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UserInfo {
  id: string;
  email: string;
  display_name: string;
  disabled: boolean;
}

export interface MemberInfo {
  user: UserInfo;
  membership: {
    user_id: string;
    org_id: string;
    roles: string[];
    member_type: string;
  };
}

export interface PagedMembers {
  items: MemberInfo[];
  page: number;
  size: number;
  total: number;
}

/**
 * Service to interact with Identity service
 * Fetches user information, org members, etc.
 */
@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  private readonly identityUrl: string;

  // Cache user info for 5 minutes
  private userCache = new Map<string, { data: UserInfo; expiry: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly configService: ConfigService) {
    // Identity service URL (internal Docker network)
    // Use internal endpoints for service-to-service communication
    this.identityUrl = this.configService.get('IDENTITY_SERVICE_URL') || 'http://identity:3000';
    this.logger.log(`Identity service URL: ${this.identityUrl}`);
  }

  /**
   * Get user info by user ID
   * Uses cache to reduce API calls
   */
  async getUserInfo(userId: string): Promise<UserInfo | null> {
    // Check cache
    const cached = this.userCache.get(userId);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    try {
      // Fallback: Basic info when Identity service is unavailable
      return {
        id: userId,
        email: `user-${userId.slice(0, 8)}@example.com`,
        display_name: `User ${userId.slice(0, 8)}`,
        disabled: false,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch user info for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get user info for multiple users
   * Batch operation with caching
   */
  async getUsersInfo(userIds: string[]): Promise<Map<string, UserInfo>> {
    const result = new Map<string, UserInfo>();

    for (const userId of userIds) {
      const info = await this.getUserInfo(userId);
      if (info) {
        result.set(userId, info);
      }
    }

    return result;
  }

  /**
   * Get members of an organization from Identity service
   * Uses internal endpoint that doesn't require authentication
   */
  async getOrgMembers(orgId: string, page = 0, size = 100): Promise<PagedMembers | null> {
    try {
      // Use internal endpoint for service-to-service communication (no auth required)
      const url = `${this.identityUrl}/internal/orgs/${orgId}/members?page=${page}&size=${size}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.error(`Failed to fetch org members: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: PagedMembers = await response.json();

      // Update cache with fetched users
      data.items.forEach(item => {
        this.userCache.set(item.user.id, {
          data: item.user,
          expiry: Date.now() + this.CACHE_TTL,
        });
      });

      return data;
    } catch (error) {
      this.logger.error('Failed to fetch org members:', error);
      return null;
    }
  }

  /**
   * Get user info from org using internal batch endpoint
   * More efficient than individual calls when fetching multiple users
   * Uses /internal/orgs/{orgId}/users endpoint
   */
  async getUsersFromOrg(orgId: string, userIds: string[]): Promise<Map<string, UserInfo>> {
    const result = new Map<string, UserInfo>();

    if (!userIds || userIds.length === 0) {
      return result;
    }

    try {
      // Call internal batch endpoint
      const userIdsParam = userIds.join(',');
      const url = `${this.identityUrl}/internal/orgs/${orgId}/users?user_ids=${encodeURIComponent(userIdsParam)}`;

      this.logger.debug(`Fetching ${userIds.length} users from org ${orgId}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add service-to-service authentication header
        },
      });

      if (!response.ok) {
        this.logger.error(`Failed to fetch users from org: ${response.status} ${response.statusText}`);
        return result;
      }

      const users: Array<{
        id: string;
        email: string;
        display_name: string;
        disabled: boolean;
      }> = await response.json();

      // Update cache and build result map
      users.forEach(user => {
        const userInfo: UserInfo = {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          disabled: user.disabled,
        };

        // Update cache
        this.userCache.set(user.id, {
          data: userInfo,
          expiry: Date.now() + this.CACHE_TTL,
        });

        result.set(user.id, userInfo);
      });

      this.logger.debug(`Successfully fetched ${users.length} users from org`);
      return result;

    } catch (error) {
      this.logger.error('Failed to fetch users from org:', error);
      return result;
    }
  }

  /**
   * Clear cache for a user
   */
  clearUserCache(userId: string): void {
    this.userCache.delete(userId);
  }

  /**
   * Clear entire cache
   */
  clearAllCache(): void {
    this.userCache.clear();
  }
}

