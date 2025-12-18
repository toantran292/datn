import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { IdentityService } from '../../services/identity.service.js';

/**
 * Guard to ensure only Super Admin (SYS_ADMIN role) can access admin endpoints
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly identityService: IdentityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get user ID from headers (set by edge/gateway after JWT verification)
    const userId = request.headers['x-user-id'];

    if (!userId) {
      throw new UnauthorizedException('Missing user authentication');
    }

    // Check if user is system admin
    const isAdmin = await this.identityService.isSystemAdmin(userId);

    if (!isAdmin) {
      throw new ForbiddenException('Only Super Admin can access this resource');
    }

    // Attach admin info to request for later use
    request.adminUser = { userId };

    return true;
  }
}
