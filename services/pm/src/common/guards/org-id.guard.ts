import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { RequestWithOrg } from '../interfaces';

@Injectable()
export class OrgIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithOrg>();
    const orgId = request.headers['x-org-id'] as string;
    
    if (!orgId || orgId.trim() === '') {
      throw new UnauthorizedException(
        'Organization ID is required. X-Org-ID header is missing or empty.'
      );
    }
    
    request.orgId = orgId;
    
    return true;
  }
}

