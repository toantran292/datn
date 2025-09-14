import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import axios from 'axios';

@Injectable()
export class JwksService {
  private readonly identityBaseUrl = process.env.IDENTITY_BASE_URL ?? 'http://localhost:40000';
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async getKeyByKid(kid: string): Promise<any | null> {
    const cacheKey = `jwks:${kid}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const jwks = await axios.get(`${this.identityBaseUrl}/.well-known/jwks.json`).then(r => r.data);
    const found = (jwks.keys || []).find((k: any) => k.kid === kid) || null;
    if (found) await this.cache.set(cacheKey, found, this.ttlMs);
    return found;
  }
}

