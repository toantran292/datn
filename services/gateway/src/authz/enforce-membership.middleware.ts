import { Injectable, NestMiddleware } from '@nestjs/common';
import { AuthzService } from './authz.service';

@Injectable()
export class EnforceMembershipMiddleware implements NestMiddleware {
  constructor(private readonly authz: AuthzService) {}

  async use(req: any, res: any, next: () => void) {
    const userId = req.headers['x-user-id'];
    const orgId = req.headers['x-org-id'];
    if (!userId || !orgId) return res.status(400).json({ error: 'missing_org_or_user' });

    const m = await this.authz.getMembership(String(userId), String(orgId));
    if (!m) return res.status(403).json({ error: 'not_a_member' });

    if (m.roles?.length) req.headers['x-roles'] = m.roles.join(',');

    next();
  }
}

