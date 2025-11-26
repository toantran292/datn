import { Injectable, NotFoundException } from '@nestjs/common';
import { types } from 'cassandra-driver';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomEntity, RoomsRepository } from './repositories/room.repository';
import { RoomMembersRepository } from './repositories/room-members.repository';
import { ChatsGateway } from '../chat/chat.gateway';

@Injectable()
export class RoomsService {
  constructor(
    private readonly roomsRepo: RoomsRepository,
    private readonly roomMembersRepo: RoomMembersRepository,
    private readonly chatsGateway: ChatsGateway,
  ) { }

  async createRoom(dto: CreateRoomDto, orgId: types.Uuid, userId: types.Uuid) {
    const room = await this.roomsRepo.create(
      orgId,
      dto.isPrivate,
      dto.name
    );

    await this.roomMembersRepo.addMember(room.id, userId, orgId);

    this.chatsGateway.notifyRoomCreated(orgId.toString(), {
      id: room.id.toString(),
      name: room.name,
      isPrivate: room.isPrivate,
      orgId: room.orgId.toString(),
    });

    return room;
  }

  async listRoomsForUser(
    userId: types.Uuid,
    orgId: types.Uuid,
    opts: { limit?: number; pagingState?: string } = {},
  ) {
    const pageSize = opts.limit ?? 50;

    const memberIds = await this.roomMembersRepo.findRoomIdsByUserOrg(userId, orgId, { limit: 10_000 });
    const memberSet = new Set(memberIds.items.map(id => id.toString()));

    let cursor = opts.pagingState;
    const picked: RoomEntity[] = [];

    do {
      const { items, pagingState } = await this.roomsRepo.listByOrg(orgId, { limit: pageSize, pagingState: cursor });
      for (const r of items) {
        if (memberSet.has(r.id.toString())) picked.push(r);
        if (picked.length >= pageSize) break;
      }
      if (picked.length >= pageSize || !pagingState) {
        cursor = pagingState ?? undefined;
        break;
      }
      cursor = pagingState;
    } while (true);

    return { items: picked, pagingState: cursor ?? null };
  }

  async joinRoom(roomId: string, orgId: types.Uuid, userId: types.Uuid) {
    const roomTid = types.TimeUuid.fromString(roomId);
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomTid);
    if (!room) throw new NotFoundException('Room not found');
    const isMember = await this.roomMembersRepo.isMember(roomTid, userId);
    if (!isMember) {
      await this.roomMembersRepo.addMember(roomTid, userId, orgId);
      this.chatsGateway.notifyRoomJoined(orgId.toString(), {
        id: room.id.toString(),
        name: room.name,
        isPrivate: room.isPrivate,
        orgId: room.orgId.toString(),
      });
    }
    return { joined: true };
  }
}
