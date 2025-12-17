import { Injectable, Logger } from '@nestjs/common';

interface IsSystemAdminResponse {
  user_id: string;
  is_system_admin: boolean;
  system_roles: string[];
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  private readonly identityUrl: string;

  constructor() {
    this.identityUrl = process.env.IDENTITY_SERVICE_URL || 'http://identity:40000';
  }

  /**
   * Check if a user is a system admin (ROOT or SYS_ADMIN role)
   */
  async isSystemAdmin(userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.identityUrl}/internal/users/${userId}/is-system-admin`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        this.logger.warn(`Failed to check system admin for user ${userId}: ${response.status}`);
        return false;
      }

      const data: IsSystemAdminResponse = await response.json();
      this.logger.log(`User ${userId} is_system_admin: ${data.is_system_admin}, roles: ${data.system_roles}`);
      return data.is_system_admin;
    } catch (error) {
      this.logger.error(`Error checking system admin for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get user's system roles (ROOT, SYS_ADMIN)
   */
  async getSystemRoles(userId: string): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.identityUrl}/internal/users/${userId}/is-system-admin`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data: IsSystemAdminResponse = await response.json();
      return data.system_roles || [];
    } catch (error) {
      this.logger.error(`Error getting system roles for user ${userId}:`, error);
      return [];
    }
  }
}
