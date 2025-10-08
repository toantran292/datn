import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Ctx, type RequestContext } from '../common/context/context.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
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

  @Get()
  async listRooms(
    @Ctx() ctx: RequestContext,
    @Query('limit') limit?: number,
    @Query('pagingState') pagingState?: string,
  ) {
    return this.roomsService.listRoomsForUser(ctx.userId, ctx.orgId, { limit, pagingState });
  }

  @Post('join')
  async joinRoom(
    @Ctx() ctx: RequestContext,
    @Body('roomId') roomId: string,
  ) {
    return this.roomsService.joinRoom(roomId, ctx.orgId, ctx.userId);
  }
}