import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import axios from 'axios';

export interface MembershipDTO {
  user_id: string;
  org_id: string;
  roles: string[];
  member_type: string;
}

@Injectable()
export class AuthzService {
  private readonly identityBaseUrl = process.env.IDENTITY_BASE_URL ?? 'http://localhost:40000';
  private readonly ttlMs = 60 * 1000; // 60s

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async getMembership(userId: string, orgId: string): Promise<MembershipDTO | null> {
    const key = `authz:member:${userId}:${orgId}`;
    const cached = await this.cache.get<MembershipDTO>(key);
    if (cached) return cached;

    try {
      const resp = await axios.get(`${this.identityBaseUrl}/internal/memberships`, {
        params: { user_id: userId, org_id: orgId },
        headers: { 'X-User-ID': userId },
      });
      const data = resp.data as MembershipDTO;
      await this.cache.set(key, data, this.ttlMs);
      return data;
    } catch {
      return null;
    }
  }
}

