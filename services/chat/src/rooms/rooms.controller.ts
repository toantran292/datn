import { Body, Controller, Get, Post, Put, Delete, Query, Param } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Ctx, type RequestContext } from '../common/context/context.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateDmDto } from './dto/create-dm.dto';
import { toRoomResponseDto } from './rooms.mapper';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @Post()
  async createRoom(
    @Ctx() ctx: RequestContext,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.createRoom(dto, ctx.orgId, ctx.userId);
  }

  // Static routes FIRST (before dynamic routes with params)
  @Get('browse/org')
  async browseOrgPublicRooms(
    @Ctx() ctx: RequestContext,
    @Query('limit') limit?: number,
    @Query('pagingState') pagingState?: string,
  ) {
    // Browse PUBLIC org-level channels only (not in any project)
    return this.roomsService.browseOrgPublicRooms(ctx.orgId, { limit, pagingState });
  }

  @Get('browse/project')
  async browseProjectPublicRooms(
    @Ctx() ctx: RequestContext,
    @Query('projectId') projectId: string,
    @Query('limit') limit?: number,
    @Query('pagingState') pagingState?: string,
  ) {
    // Browse PUBLIC project-specific channels
    if (!projectId) {
      throw new Error('projectId is required');
    }
    return this.roomsService.browseProjectPublicRooms(ctx.orgId, projectId, { limit, pagingState });
  }

  @Get('browse')
  async browsePublicRooms(
    @Ctx() ctx: RequestContext,
    @Query('limit') limit?: number,
    @Query('pagingState') pagingState?: string,
  ) {
    // DEPRECATED: Use browse/org or browse/project instead
    // List all PUBLIC rooms in org (for "Browse Channels" feature)
    return this.roomsService.listPublicRooms(ctx.orgId, { limit, pagingState });
  }

  @Post('join')
  async joinRoom(
    @Ctx() ctx: RequestContext,
    @Body('roomId') roomId: string,
  ) {
    return this.roomsService.joinRoom(roomId, ctx.orgId, ctx.userId);
  }

  @Post('dm')
  async createDm(
    @Ctx() ctx: RequestContext,
    @Body() dto: CreateDmDto,
  ) {
    const room = await this.roomsService.createDm(dto.userIds, ctx.orgId, ctx.userId);
    return {
      id: room.id,
      orgId: room.orgId,
      isPrivate: room.isPrivate,
      name: room.name,
      type: room.type,
    };
  }

  @Post('channel')
  async createChannel(
    @Ctx() ctx: RequestContext,
    @Body('name') name: string,
    @Body('is_private') isPrivate: boolean = false,
    @Body('project_id') projectId?: string | null,
  ) {
    const room = await this.roomsService.createChannel(
      name,
      isPrivate,
      ctx.orgId,
      ctx.userId,
      projectId
    );

    return {
      id: room.id,
      orgId: room.orgId,
      isPrivate: room.isPrivate,
      name: room.name,
      type: room.type,
      projectId: room.projectId || null,
    };
  }

  // ============== UC01: Room Management ==============

  @Put(':roomId')
  async updateRoom(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Body() body: { name?: string; description?: string; isPrivate?: boolean },
  ) {
    return this.roomsService.updateRoom(roomId, ctx.orgId, ctx.userId, body);
  }

  @Delete(':roomId')
  async deleteRoom(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
  ) {
    return this.roomsService.deleteRoom(roomId, ctx.orgId, ctx.userId);
  }

  @Post(':roomId/archive')
  async archiveRoom(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
  ) {
    return this.roomsService.archiveRoom(roomId, ctx.orgId, ctx.userId);
  }

  // ============== UC02: Member Management ==============

  @Get(':roomId/members')
  async listRoomMembers(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
  ) {
    return this.roomsService.listRoomMembers(roomId, ctx.orgId, ctx.userId);
  }

  @Post(':roomId/members')
  async inviteMember(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Body('userId') targetUserId: string,
  ) {
    return this.roomsService.inviteMember(roomId, ctx.orgId, ctx.userId, targetUserId);
  }

  @Delete(':roomId/members/:userId')
  async removeMember(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.roomsService.removeMember(roomId, ctx.orgId, ctx.userId, targetUserId);
  }

  @Put(':roomId/members/:userId/role')
  async updateMemberRole(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
    @Param('userId') targetUserId: string,
    @Body('role') role: 'ADMIN' | 'MEMBER',
  ) {
    return this.roomsService.updateMemberRole(roomId, ctx.orgId, ctx.userId, targetUserId, role);
  }

  // ============== UC04: Leave Room ==============

  @Post(':roomId/leave')
  async leaveRoom(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
  ) {
    return this.roomsService.leaveRoom(roomId, ctx.orgId, ctx.userId);
  }

  @Get('dms')
  async listDms(
    @Ctx() ctx: RequestContext,
    @Query('limit') limit?: number,
    @Query('pagingState') pagingState?: string,
  ) {
    // List DMs for user in org (uses optimized user_dms table)
    const result = await this.roomsService.listDms(ctx.userId, ctx.orgId, { limit, pagingState });
    return {
      items: result.items.map(toRoomResponseDto),
      pagingState: result.pagingState,
    };
  }

  @Get('org-channels')
  async listOrgChannels(
    @Ctx() ctx: RequestContext,
    @Query('limit') limit?: number,
    @Query('pagingState') pagingState?: string,
  ) {
    // List org-level channels (channels without projectId)
    const result = await this.roomsService.listOrgChannels(ctx.userId, ctx.orgId, { limit, pagingState });
    return {
      items: result.items.map(toRoomResponseDto),
      pagingState: result.pagingState,
    };
  }

  @Get('project-channels')
  async listProjectChannels(
    @Ctx() ctx: RequestContext,
    @Query('projectId') projectId: string,
    @Query('limit') limit?: number,
    @Query('pagingState') pagingState?: string,
  ) {
    // List project-specific channels
    if (!projectId) {
      throw new Error('projectId is required');
    }
    const result = await this.roomsService.listProjectChannels(ctx.userId, ctx.orgId, projectId, { limit, pagingState });
    return {
      items: result.items.map(toRoomResponseDto),
      pagingState: result.pagingState,
    };
  }

  // Generic routes LAST (catches remaining GET requests)
  @Get()
  async listJoinedRooms(
    @Ctx() ctx: RequestContext,
    @Query('limit') limit?: number,
    @Query('pagingState') pagingState?: string,
    @Query('projectId') projectId?: string,
  ) {
    // DEPRECATED: Use specific endpoints instead (org-channels, project-channels, dms)
    // List rooms that user has JOINED (shows in sidebar)
    // - If projectId provided: returns rooms in that project
    // - Otherwise: returns org-level channels only
    const result = await this.roomsService.listJoinedRooms(ctx.userId, ctx.orgId, { limit, pagingState, projectId });
    return {
      items: result.items.map(toRoomResponseDto),
      pagingState: result.pagingState,
    };
  }
}