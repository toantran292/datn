import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class ContextAuthMiddleware implements NestMiddleware {
  private readonly skewSeconds = 300; // 5 minutes
  private readonly logger = new Logger('ContextAuth');

  use(req: any, res: any, next: () => void) {
    const userId = String(req.headers['x-user-id'] || '');
    const orgId = String(req.headers['x-org-id'] || '');
    const ts = String(req.headers['x-context-timestamp'] || '');
    const signature = String(req.headers['x-context-signature'] || '');
    const orgSlug = String(req.headers['x-org-slug'] || '');

    if (!userId || !orgId || !ts || !signature) {
      return this.unauthorized(res);
    }

    const secret = process.env.CONTEXT_HMAC_SECRET;
    if (!secret) {
      // Server misconfiguration; respond 500 to avoid false positives
      res.status(500).json({ error: 'Server not configured' });
      return;
    }

    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum)) {
      return this.unauthorized(res);
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const skew = Math.abs(nowSec - Math.floor(tsNum));
    if (skew > this.skewSeconds) {
      return this.unauthorized(res);
    }

    if (orgSlug) {
      this.logger.debug(`X-Org-Slug received: ${orgSlug}`);
    }

    const payload = `${userId}|${orgId}|${Math.floor(tsNum)}`;
    const expectedHex = createHmac('sha256', secret).update(payload).digest('hex');

    // timing-safe compare on same-length buffers
    const a = Buffer.from(expectedHex, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return this.unauthorized(res);
    }

    // Attach context to request if needed downstream
    req.context = { userId, orgId, orgSlug, ts: Math.floor(tsNum) };

    next();
  }

  private unauthorized(res: any) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
