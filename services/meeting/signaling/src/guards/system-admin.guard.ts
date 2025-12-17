import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { IdentityService } from '../services/identity.service';

@Injectable()
export class SystemAdminGuard implements CanActivate {
  private readonly logger = new Logger(SystemAdminGuard.name);

  constructor(private readonly identityService: IdentityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get user ID from header or body
    const userId =
      request.headers['x-user-id'] ||
      request.body?.admin_user_id ||
      request.query?.admin_user_id;

    if (!userId) {
      this.logger.warn('No user ID provided for admin check');
      throw new ForbiddenException('User ID required for admin access');
    }

    const isAdmin = await this.identityService.isSystemAdmin(userId);

    if (!isAdmin) {
      this.logger.warn(`User ${userId} is not a system admin`);
      throw new ForbiddenException('System admin access required');
    }

    // Attach admin info to request for later use
    request.adminUserId = userId;

    return true;
  }
}
