import { Injectable, NestMiddleware } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwksService } from './jwks.service';

@Injectable()
export class VerifyJwtMiddleware implements NestMiddleware {
  private readonly issuer = process.env.TOKEN_ISSUER ?? 'identity';

  constructor(private readonly jwks: JwksService) {}

  private b64urlDecode(s: string): Buffer {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
    return Buffer.from(s + pad, 'base64');
  }

  async use(req: any, res: any, next: () => void) {
    try {
      delete req.headers['x-user-id'];
      delete req.headers['x-org-id'];
      delete req.headers['x-roles'];

      const auth: string | undefined = req.headers['authorization'];
      if (!auth || !auth.startsWith('Bearer ')) return res.status(401).end();
      const token = auth.slice('Bearer '.length).trim();
      const [h, p, sig] = token.split('.');
      if (!h || !p || !sig) return res.status(401).end();

      const header = JSON.parse(this.b64urlDecode(h).toString('utf8')) as any;
      const payload = JSON.parse(this.b64urlDecode(p).toString('utf8')) as any;

      if (payload.iss !== this.issuer) return res.status(401).end();
      if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return res.status(401).end();
      if (!payload.sub) return res.status(401).end();

      const kid: string | undefined = header.kid;
      if (!kid) return res.status(401).end();

      const jwk = await this.jwks.getKeyByKid(kid);
      if (!jwk) return res.status(401).end();

      const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' as any });
      const ok = crypto.createVerify('RSA-SHA256').update(`${h}.${p}`).verify(publicKey, this.b64urlDecode(sig));
      if (!ok) return res.status(401).end();

      req.headers['x-user-id'] = String(payload.sub);
      if (payload.org_id) req.headers['x-org-id'] = String(payload.org_id);
      if (payload.roles) req.headers['x-roles'] = Array.isArray(payload.roles) ? payload.roles.join(',') : String(payload.roles);
      delete req.headers['authorization'];

      next();
    } catch {
      return res.status(401).end();
    }
  }
}

