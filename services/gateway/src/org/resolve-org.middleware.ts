import { Injectable, NestMiddleware } from '@nestjs/common';
import { OrgResolverService } from './org-resolver.service';

@Injectable()
export class ResolveOrgMiddleware implements NestMiddleware {
  constructor(private readonly orgs: OrgResolverService) {}

  async use(req: any, res: any, next: () => void) {
    const m = req.path.match(/^\/o\/([^/]+)(?:\/|$)/);
    if (!m) return next();

    const orgSlug = decodeURIComponent(m[1]);
    req.headers['x-org-slug'] = orgSlug;

    const orgId = await this.orgs.resolveOrgId(orgSlug);
    if (!orgId) return res.status(404).json({ error: 'org_not_found', slug: orgSlug });
    req.headers['x-org-id'] = orgId;

    next();
  }
}
