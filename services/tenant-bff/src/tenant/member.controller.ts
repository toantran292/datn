import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { HmacGuard } from '../common/guards/hmac.guard';
import { IdentityService } from 'src/services/identity.service';
import { PmService } from 'src/services/pm.service';

@Controller('members')
@UseGuards(HmacGuard)
export class MemberController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly pmService: PmService,
  ) {}

  /**
   * GET /members - Get unified list of members and invitations
   * Returns both active members and pending invitations in a single response
   */
  @Get()
  getList(@Req() req) {
    return this.identityService.getMembersAndInvitations(req.orgId);
  }

  @Post('invite')
  invite(@Req() req, @Body() body: { email: string; role: string; project_ids?: string[] }) {
    return this.identityService.inviteMember(req.orgId, body.email, body.role, body.project_ids);
  }

  @Patch(':userId/role')
  updateRole(
    @Req() req,
    @Param('userId') userId: string,
    @Body() body: { role: string }
  ) {
    return this.identityService.updateMemberRole(req.orgId, userId, body.role);
  }

  @Patch(':userId/projects')
  updateProjects(
    @Req() req,
    @Param('userId') userId: string,
    @Body() body: { projectIds: string[] }
  ) {
    // Use PM service for project membership management
    return this.pmService.updateUserProjects(req.orgId, userId, body.projectIds);
  }

  @Delete(':userId')
  removeMember(@Req() req, @Param('userId') userId: string) {
    return this.identityService.removeMember(req.orgId, userId);
  }

  // Cancel invitation
  @Delete('invitations/:invitationId')
  cancelInvitation(@Req() req, @Param('invitationId') invitationId: string) {
    return this.identityService.cancelInvitation(req.orgId, invitationId);
  }

  // Resend invitation email
  @Post('invitations/:invitationId/resend')
  resendInvitation(@Req() req, @Param('invitationId') invitationId: string) {
    return this.identityService.resendInvitation(req.orgId, invitationId);
  }
}
