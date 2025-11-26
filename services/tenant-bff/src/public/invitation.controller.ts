import { Controller, Post, Body } from '@nestjs/common';
import { IdentityService } from 'src/services/identity.service';

@Controller('public/invitations')
export class InvitationController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('accept')
  async acceptInvitation(@Body() body: { token: string; password?: string }) {
    return this.identityService.acceptInvitation(body.token, body.password);
  }
}
