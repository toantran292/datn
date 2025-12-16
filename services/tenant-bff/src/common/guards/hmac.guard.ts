import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
// import { Logger } from 'nestjs-pin/o';/

interface RequestWithHeaders {
  get: (header: string) => string | undefined;
  user?: { id: string; roles: string[]; perms: string[] };
  orgId?: string;
  projectId?: string | null;
}

@Injectable()
export class HmacGuard implements CanActivate {
  private readonly logger = new Logger(HmacGuard.name);

  constructor(
    private cfg: ConfigService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  private b64(b: Buffer) {
    return b.toString('base64');
  }

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();

    const uid = req.get('X-User-ID') || '';
    const org = req.get('X-Org-ID') || '';
    const proj = req.get('X-Project-ID') || '';
    const ts = req.get('X-Auth-Timestamp') || '';
    const sigH = req.get('X-Auth-Signature') || '';
    const roles = (req.get('X-Roles') || '').split(',').filter(Boolean);
    const perms = (req.get('X-Permissions') || '').split(',').filter(Boolean);

    if (!uid || !org || !ts || !sigH) {
      throw new UnauthorizedException('missing_edge_headers');
    }

    const [ver, sigB64] = sigH.split(' ');
    if (ver !== 'v1' || !sigB64) {
      throw new UnauthorizedException('bad_signature_format');
    }

    const secret = this.cfg.get<string>('BFF_HMAC_SECRET')!;
    const skew = Number(this.cfg.get('CLOCK_SKEW_SEC') || 300);
    const replayTtl = Number(this.cfg.get('REPLAY_TTL_SEC') || 60);

    const now = Math.floor(Date.now() / 1000);
    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum) || Math.abs(now - tsNum) > skew) {
      throw new UnauthorizedException('timestamp_skew');
    }

    const payload = `${uid}|${org}|${proj}|${ts}`;
    const expected = createHmac('sha256', secret).update(payload).digest();
    const provided = Buffer.from(sigB64, 'base64');

    if (
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      throw new UnauthorizedException('invalid_signature');
    }

    // Include request method and path in replay key to allow concurrent requests to different endpoints
    const method = req.method || 'GET';
    const path = req.url || req.path || '';
    const replayKey = `sig:${sigB64}:${ts}:${method}:${path}`;
    const seen = await this.cache.get(replayKey);
    if (seen) {
      throw new ForbiddenException('replay_detected');
    }
    await this.cache.set(replayKey, 1, replayTtl * 1000);

    req.user = { id: uid, roles, perms };
    req.orgId = org;
    req.projectId = proj || null;

    return true;
  }
}
