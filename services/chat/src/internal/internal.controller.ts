import { Controller, Get, Query } from '@nestjs/common';
import { Ctx, type RequestContext } from '../common/context/context.decorator';
import { IdentityService } from '../common/identity/identity.service';
import { PresenceService } from '../common/presence/presence.service';

@Controller('internal')
export class InternalController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly presenceService: PresenceService,
  ) {}

  /**
   * List users in the organization
   * orgId is taken from context (X-Org-ID header set by Edge)
   */
  @Get('users')
  async listOrgUsers(
    @Ctx() ctx: RequestContext,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    // Get all users/members from the organization via Identity service
    // orgId comes from context (set by Edge from JWT)
    const members = await this.identityService.getOrgMembers(ctx.orgId, page || 0, size || 100);

    if (!members) {
      return [];
    }

    // Get user IDs and check online status
    const userIds = members.items.map(item => item.user.id);
    const onlineStatus = this.presenceService.getOnlineStatus(userIds);

    // Extract user info from membership data with online status
    return members.items.map(item => ({
      userId: item.user.id,
      email: item.user.email,
      displayName: item.user.display_name || item.user.email.split('@')[0],
      disabled: item.user.disabled,
      avatarUrl: item.user.avatar_url || null,
      isOnline: onlineStatus.get(item.user.id) ?? false,
    }));
  }
}

