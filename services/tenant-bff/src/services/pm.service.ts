import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PmService {
  private readonly logger = new Logger(PmService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get('PM_BASE_URL', 'http://pm:3000');
  }

  /**
   * Get all project memberships for a user within an organization
   */
  async getUserProjects(orgId: string, userId: string) {
    const url = `${this.baseUrl}/api/project-members/users/${userId}`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );
      return res.data;
    } catch (err) {
      this.logger.error(`Failed to get user projects: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Update all project memberships for a user (sync operation)
   */
  async updateUserProjects(orgId: string, userId: string, projectIds: string[], role?: string) {
    const url = `${this.baseUrl}/api/project-members/users/${userId}`;

    try {
      const res = await firstValueFrom(
        this.http.put(url, {
          projectIds,
          role,
        }, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );
      return res.data;
    } catch (err) {
      this.logger.error(`Failed to update user projects: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Get all members of a project
   */
  async getProjectMembers(orgId: string, projectId: string) {
    const url = `${this.baseUrl}/api/project-members/projects/${projectId}`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );
      return res.data;
    } catch (err) {
      this.logger.error(`Failed to get project members: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Get project roles for multiple users (bulk query)
   */
  async getProjectRolesForUsers(orgId: string, userIds: string[]) {
    const url = `${this.baseUrl}/api/project-members/bulk-user-roles`;

    try {
      const res = await firstValueFrom(
        this.http.post(url, {
          userIds,
        }, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );
      return res.data;
    } catch (err) {
      this.logger.error(`Failed to get project roles for users: ${err.message}`);
      // Return empty object on error
      return {};
    }
  }

  /**
   * Get issues assigned to current user
   */
  async getAssignedIssues(orgId: string, userId: string) {
    const url = `${this.baseUrl}/api/issues/assigned`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
            'X-User-Id': userId,
          },
        }),
      );
      return res.data;
    } catch (err) {
      this.logger.error(`Failed to get assigned issues: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }
}
