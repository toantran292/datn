import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IdentityService {
  constructor(
    private http: HttpService,
  ) {}

  async getListMembers(orgId: string) {
    const url = `http://identity:40000/orgs/${orgId}/members`;

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
    const url = `http://identity:40000/orgs/${orgId}/members/invite`;

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
    const url = `http://identity:40000/invitations/accept`;

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
}