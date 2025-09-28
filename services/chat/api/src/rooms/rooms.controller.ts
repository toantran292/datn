import { BadRequestException, Body, Controller, Param, Post } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';
import { toRoomResponseDto } from './rooms.mapper';
import { Ctx } from 'src/common/context/context.decorator';
import type { RequestContext } from 'src/common/context/context.decorator';
import { types } from 'cassandra-driver';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @Post()
  async create(@Body() dto: CreateRoomDto, @Ctx() ctx: RequestContext) {
    const room = await this.roomsService.createRoom(dto, ctx.orgId, ctx.userId);
    return toRoomResponseDto(room);
  }


  @Post(':id/join')
  async join(
    @Param('id') roomId: types.TimeUuid, @Ctx() ctx: RequestContext) {
    if (!roomId) {
      throw new BadRequestException('Missing roomId');
    }
    return this.roomsService.joinRoom(roomId, ctx.userId, ctx.orgId);
  }
}
