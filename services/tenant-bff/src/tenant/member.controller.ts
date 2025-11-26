import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { HmacGuard } from '../common/guards/hmac.guard';
import { IdentityService } from 'src/services/identity.service';

@Controller('members')
@UseGuards(HmacGuard)
export class MemberController {
  constructor(private readonly identityService: IdentityService) {}

  @Get()
  getList(@Req() req) {
    return this.identityService.getListMembers(req.orgId);
  }

  @Post('invite')
  invite(@Req() req, @Body() body: { email: string; role: string; project_ids?: string[] }) {
    return this.identityService.inviteMember(req.orgId, body.email, body.role, body.project_ids);
  }
}
