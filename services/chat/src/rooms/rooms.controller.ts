import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Ctx, type RequestContext } from '../common/context/context.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateDmDto } from './dto/create-dm.dto';
import { types } from 'cassandra-driver';

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
  @Get('browse')
  async browsePublicRooms(
    @Ctx() ctx: RequestContext,
    @Query('limit') limit?: number,
    @Query('pagingState') pagingState?: string,
  ) {
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
      id: room.id.toString(),
      orgId: room.orgId.toString(),
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
  ) {
    const room = await this.roomsService.createChannel(name, isPrivate, ctx.orgId, ctx.userId);
    return {
      id: room.id.toString(),
      orgId: room.orgId.toString(),
      isPrivate: room.isPrivate,
      name: room.name,
      type: room.type,
    };
  }

  // Dynamic routes with params SECOND
  @Get(':roomId/members')
  async listRoomMembers(
    @Ctx() ctx: RequestContext,
    @Param('roomId') roomId: string,
  ) {
    return this.roomsService.listRoomMembers(roomId, ctx.orgId, ctx.userId);
  }

  // Generic routes LAST (catches remaining GET requests)
  @Get()
  async listJoinedRooms(
    @Ctx() ctx: RequestContext,
    @Query('limit') limit?: number,
    @Query('pagingState') pagingState?: string,
  ) {
    // List rooms that user has JOINED (shows in sidebar)
    return this.roomsService.listJoinedRooms(ctx.userId, ctx.orgId, { limit, pagingState });
  }
}