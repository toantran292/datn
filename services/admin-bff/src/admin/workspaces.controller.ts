import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SuperAdminGuard } from '../common/guards/super-admin.guard.js';
import { CurrentAdmin, AdminUser } from '../common/decorators/admin-user.decorator.js';
import { IdentityService } from '../services/identity.service.js';
import {
  LockWorkspaceDto,
  UnlockWorkspaceDto,
  RevokeOwnershipDto,
  ListWorkspacesQueryDto,
} from './dto/workspace.dto.js';

@ApiTags('Admin - Workspaces')
@ApiBearerAuth()
@Controller('admin/workspaces')
@UseGuards(SuperAdminGuard)
export class WorkspacesController {
  constructor(private readonly identityService: IdentityService) {}

  @Get()
  @ApiOperation({ summary: 'List all workspaces with filtering' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async listWorkspaces(@Query() query: ListWorkspacesQueryDto) {
    return this.identityService.listWorkspaces({
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get workspace details' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  async getWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.identityService.getWorkspace(workspaceId);
  }

  @Get(':workspaceId/members')
  @ApiOperation({ summary: 'Get workspace members' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'List of workspace members' })
  async getWorkspaceMembers(@Param('workspaceId') workspaceId: string) {
    const members = await this.identityService.getWorkspaceMembers(workspaceId);
    return { members };
  }

  @Post(':workspaceId/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC08: Lock a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID to lock' })
  @ApiResponse({ status: 200, description: 'Workspace locked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async lockWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: LockWorkspaceDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.identityService.lockWorkspace(workspaceId, admin.userId, dto.reason);
  }

  @Post(':workspaceId/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC08: Unlock a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID to unlock' })
  @ApiResponse({ status: 200, description: 'Workspace unlocked successfully' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async unlockWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UnlockWorkspaceDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.identityService.unlockWorkspace(workspaceId, admin.userId, dto.note);
  }

  @Post(':workspaceId/revoke-ownership')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC12: Revoke ownership from current owner' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Ownership revoked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async revokeOwnership(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: RevokeOwnershipDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.identityService.revokeOwnership(workspaceId, admin.userId, {
      reason: dto.reason,
      newOwnerId: dto.newOwnerId,
      removeCurrentOwner: dto.removeCurrentOwner,
    });
  }
}
