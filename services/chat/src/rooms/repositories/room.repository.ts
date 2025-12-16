import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Room, RoomType } from '../../database/entities/room.entity';
import { RoomMember } from '../../database/entities/room-member.entity';

export type { RoomType } from '../../database/entities/room.entity';

export interface RoomEntity {
  id: string;
  orgId: string;
  isPrivate: boolean;
  name: string | undefined;
  type: RoomType;
  projectId?: string | null;
}

export interface UserRoomEntity {
  userId: string;
  orgId: string;
  roomId: string;
  roomType: RoomType;
  roomName: string | undefined;
  isPrivate: boolean;
  projectId?: string | null;
  joinedAt: Date;
  lastSeenMessageId?: string;
}

@Injectable()
export class RoomsRepository {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(RoomMember)
    private readonly memberRepo: Repository<RoomMember>,
  ) {}

  async create(
    orgId: string,
    isPrivate: boolean,
    name: string | undefined,
    type: RoomType = 'channel',
    projectId?: string | null,
  ): Promise<RoomEntity> {
    const entity = this.roomRepo.create({
      orgId,
      isPrivate,
      name: name ?? null,
      type,
      projectId: projectId ?? null,
    });

    const saved = await this.roomRepo.save(entity);

    return {
      id: saved.id,
      orgId: saved.orgId,
      isPrivate: saved.isPrivate,
      name: saved.name ?? undefined,
      type: saved.type,
      projectId: saved.projectId,
    };
  }

  async findByOrgAndId(orgId: string, roomId: string): Promise<RoomEntity | null> {
    const room = await this.roomRepo.findOne({
      where: { id: roomId, orgId, status: 'ACTIVE' },
    });

    if (!room) return null;

    return {
      id: room.id,
      orgId: room.orgId,
      isPrivate: room.isPrivate,
      name: room.name ?? undefined,
      type: room.type,
      projectId: room.projectId,
    };
  }

  async findByIds(orgId: string, ids: string[]): Promise<RoomEntity[]> {
    if (!ids?.length) return [];

    const rooms = await this.roomRepo.find({
      where: { orgId, id: In(ids), status: 'ACTIVE' },
    });

    return rooms.map((room) => ({
      id: room.id,
      orgId: room.orgId,
      isPrivate: room.isPrivate,
      name: room.name ?? undefined,
      type: room.type,
      projectId: room.projectId,
    }));
  }

  async listByOrg(
    orgId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: RoomEntity[]; pagingState?: string }> {
    const limit = opts.limit ?? 50;
    const offset = opts.pagingState ? parseInt(opts.pagingState, 10) : 0;

    const [rooms, total] = await this.roomRepo.findAndCount({
      where: { orgId, status: 'ACTIVE' },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    const items = rooms.map((room) => ({
      id: room.id,
      orgId: room.orgId,
      isPrivate: room.isPrivate,
      name: room.name ?? undefined,
      type: room.type,
      projectId: room.projectId,
    }));

    const nextOffset = offset + rooms.length;
    const hasMore = nextOffset < total;

    return {
      items,
      pagingState: hasMore ? nextOffset.toString() : undefined,
    };
  }

  async listJoinedRoomsByUser(
    userId: string,
    orgId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: UserRoomEntity[]; pagingState?: string }> {
    const limit = opts.limit ?? 50;
    const offset = opts.pagingState ? parseInt(opts.pagingState, 10) : 0;

    const query = this.memberRepo
      .createQueryBuilder('rm')
      .innerJoinAndSelect('rm.room', 'r')
      .where('rm.userId = :userId', { userId })
      .andWhere('rm.orgId = :orgId', { orgId })
      .andWhere('r.status = :status', { status: 'ACTIVE' })
      .orderBy('rm.joinedAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [members, total] = await query.getManyAndCount();

    const items: UserRoomEntity[] = members.map((m) => ({
      userId: m.userId,
      orgId: m.orgId,
      roomId: m.roomId,
      roomType: m.room.type,
      roomName: m.room.name ?? undefined,
      isPrivate: m.room.isPrivate,
      projectId: m.room.projectId,
      joinedAt: m.joinedAt,
      lastSeenMessageId: m.lastSeenMessageId ?? undefined,
    }));

    const nextOffset = offset + members.length;
    const hasMore = nextOffset < total;

    return {
      items,
      pagingState: hasMore ? nextOffset.toString() : undefined,
    };
  }

  async listJoinedRoomsByUserAndProject(
    userId: string,
    orgId: string,
    projectId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: UserRoomEntity[]; pagingState?: string }> {
    const limit = opts.limit ?? 50;
    const offset = opts.pagingState ? parseInt(opts.pagingState, 10) : 0;

    const query = this.memberRepo
      .createQueryBuilder('rm')
      .innerJoinAndSelect('rm.room', 'r')
      .where('rm.userId = :userId', { userId })
      .andWhere('rm.orgId = :orgId', { orgId })
      .andWhere('r.projectId = :projectId', { projectId })
      .andWhere('r.status = :status', { status: 'ACTIVE' })
      .orderBy('rm.joinedAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [members, total] = await query.getManyAndCount();

    const items: UserRoomEntity[] = members.map((m) => ({
      userId: m.userId,
      orgId: m.orgId,
      roomId: m.roomId,
      roomType: m.room.type,
      roomName: m.room.name ?? undefined,
      isPrivate: m.room.isPrivate,
      projectId: m.room.projectId,
      joinedAt: m.joinedAt,
      lastSeenMessageId: m.lastSeenMessageId ?? undefined,
    }));

    const nextOffset = offset + members.length;
    const hasMore = nextOffset < total;

    return {
      items,
      pagingState: hasMore ? nextOffset.toString() : undefined,
    };
  }

  async listDmsByUser(
    userId: string,
    orgId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: UserRoomEntity[]; pagingState?: string }> {
    const limit = opts.limit ?? 50;
    const offset = opts.pagingState ? parseInt(opts.pagingState, 10) : 0;

    const query = this.memberRepo
      .createQueryBuilder('rm')
      .innerJoinAndSelect('rm.room', 'r')
      .where('rm.userId = :userId', { userId })
      .andWhere('rm.orgId = :orgId', { orgId })
      .andWhere('r.type = :type', { type: 'dm' })
      .andWhere('r.status = :status', { status: 'ACTIVE' })
      .orderBy('rm.joinedAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [members, total] = await query.getManyAndCount();

    const items: UserRoomEntity[] = members.map((m) => ({
      userId: m.userId,
      orgId: m.orgId,
      roomId: m.roomId,
      roomType: 'dm',
      roomName: m.room.name ?? undefined,
      isPrivate: true,
      projectId: null,
      joinedAt: m.joinedAt,
      lastSeenMessageId: m.lastSeenMessageId ?? undefined,
    }));

    const nextOffset = offset + members.length;
    const hasMore = nextOffset < total;

    return {
      items,
      pagingState: hasMore ? nextOffset.toString() : undefined,
    };
  }

  async update(
    roomId: string,
    data: Partial<{ name: string; description: string; isPrivate: boolean; avatarUrl: string }>,
  ): Promise<void> {
    await this.roomRepo.update(roomId, data);
  }

  async archive(roomId: string): Promise<void> {
    await this.roomRepo.update(roomId, {
      status: 'ARCHIVED',
      archivedAt: new Date(),
    });
  }

  async softDelete(roomId: string): Promise<void> {
    await this.roomRepo.update(roomId, {
      status: 'DELETED',
    });
  }
}
