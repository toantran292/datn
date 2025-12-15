import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IdentityService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
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

  async updateMemberRole(orgId: string, userId: string, roles: string[]) {
    const url = `${this.baseUrl}/orgs/${orgId}/members/roles`;

    try {
      const res = await firstValueFrom(
        this.http.put(url, {
          userId,
          roles
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

  /**
   * Get unified list of members and pending invitations
   * Returns both active members and pending invitations in a single response
   */
  async getMembersAndInvitations(orgId: string) {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        this.getListMembers(orgId),
        this.listInvitations(orgId),
      ]);

      // Transform members to unified format
      const members = (membersRes?.items || []).map((m: any) => ({
        id: m.id,
        type: 'member' as const,
        email: m.email,
        displayName: m.display_name || m.email?.split('@')[0],
        role: m.role?.toLowerCase() || 'member',
        status: 'active' as const,
        avatarUrl: m.avatar_url,
        joinedAt: m.joined_at,
        projectRoles: m.project_roles || [],
      }));

      // Transform invitations to unified format
      const invitations = (invitationsRes?.invitations || []).map((inv: any) => ({
        id: inv.id,
        type: 'invitation' as const,
        email: inv.email,
        displayName: inv.email?.split('@')[0],
        role: inv.memberType?.toLowerCase() || 'member',
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
}