import { Injectable, NotFoundException } from '@nestjs/common';
import { types } from 'cassandra-driver';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomRepository } from './repositories/room.repository';
import { RoomMembersRepository } from './repositories/room-members.repository';
import { UsersRepository } from 'src/users/users.repository';
import { ChatGateway } from 'src/chat/chat.gateway';
import { AuthenticatedSocket } from 'common/types/socket.types';

@Injectable()
export class RoomsService {
  constructor(
    private readonly roomRepo: RoomRepository,
    private readonly roomMembersRepo: RoomMembersRepository,
    private readonly usersRepo: UsersRepository,
    private readonly chatGateway: ChatGateway,
  ) { }

  async createRoom(dto: CreateRoomDto, orgId: types.Uuid, userId: types.Uuid) {

    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const room = await this.roomRepo.create(
      orgId,
      dto.isPrivate,
    );

    await this.roomMembersRepo.addMember(room.id, userId, orgId);

    return room;
  }

  async joinRoom(roomId: types.TimeUuid, userId: types.Uuid, orgId: types.Uuid) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    if (!(await this.roomMembersRepo.isMember(roomId, userId))) {
      await this.roomMembersRepo.addMember(roomId, userId, orgId);
    }

    const joinedCount = this.chatGateway.handleJoinRoom({ roomId }, { userId, orgId } as AuthenticatedSocket);

    return { ok: true, roomId, userId, orgId, socketsJoined: joinedCount };
  }
}
