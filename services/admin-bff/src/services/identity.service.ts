import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'LOCKED';
  lockReason?: string;
  lockedAt?: string;
  lockedBy?: string;
  owner: {
    id: string;
    email: string;
    displayName: string;
  };
  memberCount: number;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  email: string;
  displayName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  private readonly baseUrl: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {
    this.baseUrl = this.config.get('IDENTITY_BASE_URL', 'http://identity:3000');
  }

  /**
   * Check if user has Super Admin (SYS_ADMIN) role
   */
  async isSystemAdmin(userId: string): Promise<boolean> {
    const url = `${this.baseUrl}/internal/users/${userId}/is-system-admin`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-Internal-Call': 'admin-bff' },
        }),
      );

      return res.data?.is_system_admin === true;
    } catch (err: any) {
      this.logger.error(`Failed to check system admin status: ${err.message}`);
      return false;
    }
  }

  /**
   * Get all workspaces (organizations) for admin management
   */
  async listWorkspaces(params: {
    status?: 'ACTIVE' | 'LOCKED';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ workspaces: WorkspaceInfo[]; total: number; page: number; totalPages: number }> {
    const url = `${this.baseUrl}/internal/admin/workspaces`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-Internal-Call': 'admin-bff' },
          params: {
            status: params.status,
            search: params.search,
            page: params.page || 1,
            limit: params.limit || 20,
          },
        }),
      );

      return res.data;
    } catch (err: any) {
      this.logger.error(`Failed to list workspaces: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Get single workspace details
   */
  async getWorkspace(workspaceId: string): Promise<WorkspaceInfo> {
    const url = `${this.baseUrl}/internal/admin/workspaces/${workspaceId}`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-Internal-Call': 'admin-bff' },
        }),
      );

      return res.data;
    } catch (err: any) {
      this.logger.error(`Failed to get workspace: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * UC08: Lock a workspace
   */
  async lockWorkspace(
    workspaceId: string,
    adminId: string,
    reason: string,
  ): Promise<{ success: boolean; workspace: WorkspaceInfo; notificationsSent: number }> {
    const url = `${this.baseUrl}/internal/admin/workspaces/${workspaceId}/lock`;

    try {
      const res = await firstValueFrom(
        this.http.post(
          url,
          { reason },
          {
            headers: {
              'X-Internal-Call': 'admin-bff',
              'X-Admin-Id': adminId,
            },
          },
        ),
      );

      return res.data;
    } catch (err: any) {
      this.logger.error(`Failed to lock workspace: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * UC08: Unlock a workspace
   */
  async unlockWorkspace(
    workspaceId: string,
    adminId: string,
    note?: string,
  ): Promise<{ success: boolean; workspace: WorkspaceInfo; notificationsSent: number }> {
    const url = `${this.baseUrl}/internal/admin/workspaces/${workspaceId}/unlock`;

    try {
      const res = await firstValueFrom(
        this.http.post(
          url,
          { note },
          {
            headers: {
              'X-Internal-Call': 'admin-bff',
              'X-Admin-Id': adminId,
            },
          },
        ),
      );

      return res.data;
    } catch (err: any) {
      this.logger.error(`Failed to unlock workspace: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Get workspace members (for ownership transfer)
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const url = `${this.baseUrl}/internal/admin/workspaces/${workspaceId}/members`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-Internal-Call': 'admin-bff' },
        }),
      );

      return res.data?.members || [];
    } catch (err: any) {
      this.logger.error(`Failed to get workspace members: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * UC12: Revoke ownership from current owner (Super Admin action)
   */
  async revokeOwnership(
    workspaceId: string,
    adminId: string,
    data: {
      reason: string;
      newOwnerId?: string;
      removeCurrentOwner?: boolean;
    },
  ): Promise<{
    success: boolean;
    workspace: WorkspaceInfo;
    previousOwner: { id: string; name: string; newRole: string };
    newOwner?: { id: string; name: string };
  }> {
    const url = `${this.baseUrl}/internal/admin/workspaces/${workspaceId}/revoke-ownership`;

    try {
      const res = await firstValueFrom(
        this.http.post(url, data, {
          headers: {
            'X-Internal-Call': 'admin-bff',
            'X-Admin-Id': adminId,
          },
        }),
      );

      return res.data;
    } catch (err: any) {
      this.logger.error(`Failed to revoke ownership: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Get all users for admin management
   */
  async listUsers(params: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: any[]; total: number; page: number; totalPages: number }> {
    const url = `${this.baseUrl}/internal/admin/users`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-Internal-Call': 'admin-bff' },
          params: {
            search: params.search,
            page: params.page || 1,
            limit: params.limit || 20,
          },
        }),
      );

      return res.data;
    } catch (err: any) {
      this.logger.error(`Failed to list users: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Get admin dashboard statistics
   */
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalWorkspaces: number;
    activeWorkspaces: number;
    lockedWorkspaces: number;
    newUsersThisMonth: number;
    newWorkspacesThisMonth: number;
  }> {
    const url = `${this.baseUrl}/internal/admin/stats`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-Internal-Call': 'admin-bff' },
        }),
      );

      return res.data;
    } catch (err: any) {
      this.logger.error(`Failed to get dashboard stats: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }
}
