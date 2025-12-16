import { Controller, Get, Param, Query } from '@nestjs/common';
import { Ctx, type RequestContext } from '../common/context/context.decorator';
import { IdentityService } from '../common/identity/identity.service';

@Controller('internal')
export class InternalController {
  constructor(private readonly identityService: IdentityService) {}

  @Get('orgs/:orgId/users')
  async listOrgUsers(
    @Ctx() ctx: RequestContext,
    @Param('orgId') orgId: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    // Get all users/members from the organization via Identity service
    const members = await this.identityService.getOrgMembers(orgId, page || 0, size || 100);

    if (!members) {
      return [];
    }

    // Extract user info from membership data
    return members.items.map(item => ({
      userId: item.user.id,
      email: item.user.email,
      displayName: item.user.display_name || item.user.email.split('@')[0],
      disabled: item.user.disabled,
    }));
  }
}

