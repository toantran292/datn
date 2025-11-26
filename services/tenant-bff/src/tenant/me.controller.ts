import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { HmacGuard } from '../common/guards/hmac.guard';

@Controller('tenant')
@UseGuards(HmacGuard)
export class MeController {
  @Get('me')
  me(@Req() req) {
    return {
      user: {
        id: req.user.id,
        roles: req.user.roles,
        perms: req.user.perms
      },
      orgId: req.orgId,
      projectId: req.projectId
    };
  }
}
