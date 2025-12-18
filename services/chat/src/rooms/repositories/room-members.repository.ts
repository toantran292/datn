import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomMember, MemberRole } from '../../database/entities/room-member.entity';

export interface RoomMemberEntity {
  roomId: string;
  userId: string;
  orgId: string;
  role?: MemberRole;
  lastSeenMessageId?: string;
  joinedAt?: Date;
}

@Injectable()
export class RoomMembersRepository {
  constructor(
    @InjectRepository(RoomMember)
    private readonly memberRepo: Repository<RoomMember>,
  ) {}

  async addMember(
    roomId: string,
    userId: string,
    orgId: string,
    roomData?: {
      roomType: 'channel' | 'dm';
      roomName?: string;
      isPrivate: boolean;
      projectId?: string | null;
    },
    role: MemberRole = 'MEMBER',
  ): Promise<RoomMemberEntity> {
    const entity = this.memberRepo.create({
      roomId,
      userId,
      orgId,
      role,
    });

    const saved = await this.memberRepo.save(entity);

    return {
      roomId: saved.roomId,
      userId: saved.userId,
      orgId: saved.orgId,
      role: saved.role,
      lastSeenMessageId: saved.lastSeenMessageId ?? undefined,
      joinedAt: saved.joinedAt,
    };
  }

  async isMember(roomId: string, userId: string): Promise<boolean> {
    const count = await this.memberRepo.count({
      where: { roomId, userId },
    });
    return count > 0;
  }

  async findRoomIdsByUserOrg(
    userId: string,
    orgId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: string[]; pagingState?: string }> {
    const limit = opts.limit ?? 50;
    const offset = opts.pagingState ? parseInt(opts.pagingState, 10) : 0;

    const [members, total] = await this.memberRepo.findAndCount({
      where: { userId, orgId },
      select: ['roomId'],
      skip: offset,
      take: limit,
    });

    const items = members.map((m) => m.roomId);
    const nextOffset = offset + members.length;
    const hasMore = nextOffset < total;

    return {
      items,
      pagingState: hasMore ? nextOffset.toString() : undefined,
    };
  }

  async findOrgIdsByUser(userId: string): Promise<string[]> {
    const members = await this.memberRepo
      .createQueryBuilder('rm')
      .select('DISTINCT rm.org_id', 'orgId')
      .where('rm.user_id = :userId', { userId })
      .getRawMany();

    return members.map((m) => m.orgId);
  }

  async findOrgIdStringsByUser(userId: string): Promise<string[]> {
    return this.findOrgIdsByUser(userId);
  }

  async getLastSeen(roomId: string, userId: string): Promise<string | null> {
    const member = await this.memberRepo.findOne({
      where: { roomId, userId },
      select: ['lastSeenMessageId'],
    });
    return member?.lastSeenMessageId ?? null;
  }

  async get(roomId: string, userId: string): Promise<RoomMemberEntity | null> {
    const member = await this.memberRepo.findOne({
      where: { roomId, userId },
    });

    if (!member) return null;

    return {
      roomId: member.roomId,
      userId: member.userId,
      orgId: member.orgId,
      role: member.role,
      lastSeenMessageId: member.lastSeenMessageId ?? undefined,
      joinedAt: member.joinedAt,
    };
  }

  async updateLastSeen(
    roomId: string,
    userId: string,
    lastId: string,
    orgId: string,
  ): Promise<void> {
    await this.memberRepo.update(
      { roomId, userId },
      { lastSeenMessageId: lastId },
    );
  }

  async updateLastSeenWithRoomInfo(
    roomId: string,
    userId: string,
    lastId: string,
    orgId: string,
    roomType: 'channel' | 'dm',
    projectId?: string | null,
  ): Promise<void> {
    await this.memberRepo.update(
      { roomId, userId },
      { lastSeenMessageId: lastId },
    );
  }

  async updateLastSeenIfNewer(
    roomId: string,
    userId: string,
    messageId: string,
    orgId: string,
  ): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { roomId, userId },
      select: ['lastSeenMessageId'],
    });

    const shouldUpdate = !member?.lastSeenMessageId;

    if (shouldUpdate) {
      await this.updateLastSeen(roomId, userId, messageId, orgId);
    }
  }

  async findMembersByRoom(
    roomId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: RoomMemberEntity[]; pagingState?: string }> {
    const limit = opts.limit ?? 100;
    const offset = opts.pagingState ? parseInt(opts.pagingState, 10) : 0;

    const [members, total] = await this.memberRepo.findAndCount({
      where: { roomId },
      skip: offset,
      take: limit,
    });

    const items: RoomMemberEntity[] = members.map((m) => ({
      roomId: m.roomId,
      userId: m.userId,
      orgId: m.orgId,
      role: m.role,
      lastSeenMessageId: m.lastSeenMessageId ?? undefined,
      joinedAt: m.joinedAt,
    }));

    const nextOffset = offset + members.length;
    const hasMore = nextOffset < total;

    return {
      items,
      pagingState: hasMore ? nextOffset.toString() : undefined,
    };
  }

  async removeMember(roomId: string, userId: string): Promise<void> {
    await this.memberRepo.delete({ roomId, userId });
  }

  async updateRole(roomId: string, userId: string, role: MemberRole): Promise<void> {
    await this.memberRepo.update({ roomId, userId }, { role });
  }

  async countAdmins(roomId: string): Promise<number> {
    return this.memberRepo.count({
      where: { roomId, role: 'ADMIN' },
    });
  }

  /**
   * Find the oldest non-admin member in a room (excluding a specific user)
   * Used for transferring admin when the last admin leaves
   */
  async findOldestNonAdminMember(roomId: string, excludeUserId: string): Promise<RoomMemberEntity | null> {
    const member = await this.memberRepo.findOne({
      where: {
        roomId,
        role: 'MEMBER',
      },
      order: { joinedAt: 'ASC' },
    });

    // If the oldest member is the one being excluded, find the next one
    if (member && member.userId === excludeUserId) {
      const members = await this.memberRepo.find({
        where: {
          roomId,
          role: 'MEMBER',
        },
        order: { joinedAt: 'ASC' },
        take: 2,
      });
      const nextMember = members.find(m => m.userId !== excludeUserId);
      if (!nextMember) return null;
      return {
        roomId: nextMember.roomId,
        userId: nextMember.userId,
        orgId: nextMember.orgId,
        role: nextMember.role,
        lastSeenMessageId: nextMember.lastSeenMessageId ?? undefined,
        joinedAt: nextMember.joinedAt,
      };
    }

    if (!member) return null;

    return {
      roomId: member.roomId,
      userId: member.userId,
      orgId: member.orgId,
      role: member.role,
      lastSeenMessageId: member.lastSeenMessageId ?? undefined,
      joinedAt: member.joinedAt,
    };
  }

  /**
   * Count total members in a room
   */
  async countMembers(roomId: string): Promise<number> {
    return this.memberRepo.count({
      where: { roomId },
    });
  }

  async findRoomIdsByUser(userId: string, orgId: string): Promise<string[]> {
    const members = await this.memberRepo.find({
      where: { userId, orgId },
      select: ['roomId'],
    });
    return members.map(m => m.roomId);
  }
}
