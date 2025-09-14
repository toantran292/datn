import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import axios from 'axios';

@Injectable()
export class OrgResolverService {
  private readonly identityBaseUrl = process.env.IDENTITY_BASE_URL ?? 'http://localhost:40000';
  private readonly ttlMs = 2 * 60 * 1000; // 2 minutes
  private readonly uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async resolveOrgId(slugOrId: string): Promise<string | null> {
    const key = slugOrId.trim();
    if (!key) return null;
    // If already a UUID, return as-is
    if (this.uuidRe.test(key)) return key;

    const cacheKey = `org:slug:${key.toLowerCase()}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    try {
      const resp = await axios.get(`${this.identityBaseUrl}/orgs/resolve`, { params: { slug: key } });
      const orgId = resp.data?.org_id as string | undefined;
      if (orgId) {
        await this.cache.set(cacheKey, orgId, this.ttlMs);
        return orgId;
      }
      return null;
    } catch {
      return null;
    }
  }
}

