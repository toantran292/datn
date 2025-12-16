import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { IdentityService } from 'src/services/identity.service';

@Controller('public/invitations')
export class InvitationController {
  constructor(private readonly identityService: IdentityService) {}

  @Get('preview')
  async getInvitationPreview(@Query('token') token: string) {
    return this.identityService.getInvitationPreview(token);
  }

  @Post('accept')
  async acceptInvitation(@Body() body: { token: string; password?: string }) {
    return this.identityService.acceptInvitation(body.token, body.password);
  }
}
