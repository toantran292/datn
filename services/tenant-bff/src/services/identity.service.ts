import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PmService } from './pm.service';

@Injectable()
export class IdentityService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
    @Inject(forwardRef(() => PmService))
    private pmService: PmService,
  ) {
    this.baseUrl = this.config.get('IDENTITY_BASE_URL', 'http://identity:3000');
  }

  async getListMembers(orgId: string) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}/members`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({err})
      throw err.response?.data ?? err;
    }
  }

  async inviteMember(orgId: string, email: string, role: string, project_ids?: string[]) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}/members/invite`;

    try {
      const res = await firstValueFrom(
        this.http.post(url, {
          email,
          role,
          project_ids: project_ids || []
        }, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({err})
      throw err.response?.data ?? err;
    }
  }

  async getInvitationPreview(token: string) {
    const url = `${this.baseUrl}/invitations/preview?token=${encodeURIComponent(token)}`;

    try {
      const res = await firstValueFrom(
        this.http.get(url),
      );

      return res.data;
    } catch (err) {
      console.log({err})
      throw err.response?.data ?? err;
    }
  }

  async acceptInvitation(token: string, password?: string) {
    const url = `${this.baseUrl}/invitations/accept`;

    try {
      const res = await firstValueFrom(
        this.http.post(url, {
          token,
          password
        }, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({err})
      throw err.response?.data ?? err;
    }
  }

  async updateMemberRole(orgId: string, userId: string, role: string) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}/members/${userId}/role`;

    try {
      const res = await firstValueFrom(
        this.http.patch(url, {
          role
        }, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({err})
      throw err.response?.data ?? err;
    }
  }

  async removeMember(orgId: string, userId: string) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}/members/${userId}`;

    try {
      const res = await firstValueFrom(
        this.http.delete(url, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({err})
      throw err.response?.data ?? err;
    }
  }

  async listInvitations(orgId: string) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}/invitations`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({err})
      throw err.response?.data ?? err;
    }
  }

  async cancelInvitation(orgId: string, invitationId: string) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}/invitations/${invitationId}`;

    try {
      const res = await firstValueFrom(
        this.http.delete(url, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({err})
      throw err.response?.data ?? err;
    }
  }

  async resendInvitation(orgId: string, invitationId: string) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}/invitations/${invitationId}/resend`;

    try {
      const res = await firstValueFrom(
        this.http.post(url, {}, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({err})
      throw err.response?.data ?? err;
    }
  }

  /**
   * Get unified list of members and pending invitations
   * Returns both active members and pending invitations in a single response
   * Also fetches project roles from PM service
   */
  async getMembersAndInvitations(orgId: string) {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        this.getListMembers(orgId),
        this.listInvitations(orgId),
      ]);

      const memberItems = membersRes?.items || [];
      const userIds = memberItems.map((m: any) => m.id);

      // Fetch project roles from PM service for all members
      let projectRolesMap: Record<string, Array<{
        projectId: string;
        projectName: string;
        projectIdentifier: string;
        role: string;
      }>> = {};

      if (userIds.length > 0) {
        try {
          projectRolesMap = await this.pmService.getProjectRolesForUsers(orgId, userIds);
        } catch (err) {
          console.log('Failed to fetch project roles from PM:', err);
          // Continue without project roles if PM service fails
        }
      }

      // Transform members to unified format with project roles
      const members = memberItems.map((m: any) => ({
        id: m.id,
        type: 'member' as const,
        email: m.email,
        displayName: m.display_name || m.email?.split('@')[0],
        role: m.role?.toLowerCase() || 'member',
        status: 'active' as const,
        avatarUrl: m.avatar_url,
        joinedAt: m.joined_at,
        projectRoles: projectRolesMap[m.id] || [],
      }));

      // Transform invitations to unified format
      const invitations = (invitationsRes?.invitations || []).map((inv: any) => ({
        id: inv.id,
        type: 'invitation' as const,
        email: inv.email,
        displayName: inv.email?.split('@')[0],
        role: inv.role?.toLowerCase() || 'member',
        status: 'pending' as const,
        invitedAt: inv.createdAt,
      }));

      return {
        items: [...members, ...invitations],
        totalMembers: members.length,
        totalInvitations: invitations.length,
        total: members.length + invitations.length,
      };
    } catch (err) {
      console.log({ err });
      throw err;
    }
  }

  /**
   * Get organization settings
   */
  async getOrgSettings(orgId: string) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({ err });
      throw err.response?.data ?? err;
    }
  }

  /**
   * Update organization settings
   */
  async updateOrgSettings(orgId: string, data: { name?: string; description?: string }) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}`;

    // Map 'name' to 'displayName' for Identity service
    const payload: { displayName?: string; description?: string } = {};
    if (data.name !== undefined) {
      payload.displayName = data.name;
    }
    if (data.description !== undefined) {
      payload.description = data.description;
    }

    try {
      const res = await firstValueFrom(
        this.http.patch(url, payload, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({ err });
      throw err.response?.data ?? err;
    }
  }

  /**
   * Update organization logo URL
   */
  async updateOrgLogo(orgId: string, logoUrl: string | null) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}/logo`;

    try {
      const res = await firstValueFrom(
        this.http.patch(url, { logoUrl }, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({ err });
      throw err.response?.data ?? err;
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(orgId: string) {
    const url = `${this.baseUrl}/internal/orgs/${orgId}`;

    try {
      const res = await firstValueFrom(
        this.http.delete(url, {
          headers: {
            'X-Internal-Call': 'bff',
          }
        }),
      );

      return res.data;
    } catch (err) {
      console.log({ err });
      throw err.response?.data ?? err;
    }
  }
}