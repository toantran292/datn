import { Inject, Injectable } from '@nestjs/common';
import { mapping, types, Client } from 'cassandra-driver';
import { CASS_MAPPER, CASS_CLIENT } from '../../cassandra/cassandra.module';

export interface RoomMemberEntity {
  roomId: types.TimeUuid;
  userId: types.Uuid;
  orgId: types.Uuid;
  lastSeenMessageId?: types.TimeUuid;
}

@Injectable()
export class RoomMembersRepository {
  private model: mapping.ModelMapper<RoomMemberEntity>;

  constructor(
    @Inject(CASS_MAPPER) mapper: mapping.Mapper,
    @Inject(CASS_CLIENT) private readonly client: Client,
  ) {
    this.model = mapper.forModel<RoomMemberEntity>('RoomMember');
  }

  async addMember(
    roomId: types.TimeUuid,
    userId: types.Uuid,
    orgId: types.Uuid,
    roomData?: {
      roomType: 'channel' | 'dm';
      roomName?: string;
      isPrivate: boolean;
      projectId?: types.Uuid | null;
    }
  ) {
    const row: RoomMemberEntity = { roomId, userId, orgId };
    const joinedAt = new Date();

    // Use batch to write to multiple tables for consistency
    const queries = [
      {
        query: 'INSERT INTO chat.room_members (room_id, user_id, org_id) VALUES (?, ?, ?)',
        params: [roomId, userId, orgId],
      },
    ];

    // If room data is provided, write to denormalized tables
    if (roomData) {
      // Write to user_rooms for general joined rooms lookup
      queries.push({
        query: `INSERT INTO chat.user_rooms (user_id, org_id, room_id, room_type, room_name, is_private, project_id, joined_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [userId, orgId, roomId, roomData.roomType, roomData.roomName, roomData.isPrivate, roomData.projectId, joinedAt] as any[],
      });

      // If project-specific, write to user_project_rooms
      if (roomData.projectId) {
        queries.push({
          query: `INSERT INTO chat.user_project_rooms (user_id, org_id, project_id, room_id, room_type, room_name, is_private, joined_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [userId, orgId, roomData.projectId, roomId, roomData.roomType, roomData.roomName, roomData.isPrivate, joinedAt] as any[],
        });
      }

      // If DM, write to user_dms
      if (roomData.roomType === 'dm') {
        queries.push({
          query: `INSERT INTO chat.user_dms (user_id, org_id, room_id, room_name, joined_at)
                  VALUES (?, ?, ?, ?, ?)`,
          params: [userId, orgId, roomId, roomData.roomName, joinedAt] as any[],
        });
      }
    }

    // Execute batch
    await this.client.batch(queries, { prepare: true });

    return row;
  }

  async isMember(roomId: types.TimeUuid, userId: types.Uuid) {
    const res = await this.model.find({
      roomId,
      userId,
    });
    return !!res.first();
  }

  async findRoomIdsByUserOrg(
    userId: types.Uuid,
    orgId: types.Uuid,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: types.TimeUuid[]; pagingState?: string }> {
    const q =
      'SELECT room_id FROM chat.room_members WHERE org_id = ? AND user_id = ? ALLOW FILTERING';
    const rs = await this.client.execute(q, [orgId, userId], {
      prepare: true,
      fetchSize: opts.limit ?? 50,
      pageState: opts.pagingState,
    });
    const items = rs.rows.map(r => r['room_id'] as types.TimeUuid);
    return { items, pagingState: rs.pageState ?? undefined };
  }

  async findOrgIdsByUser(userId: types.Uuid): Promise<types.Uuid[]> {
    const q = 'SELECT org_id FROM chat.room_members WHERE user_id = ? ALLOW FILTERING';
    const rs = await this.client.execute(q, [userId], { prepare: true });
    const seen = new Set<string>();
    const out: types.Uuid[] = [];
    for (const row of rs.rows) {
      const id = row['org_id'] as types.Uuid;
      const k = id.toString();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(id);
      }
    }
    return out;
  }

  async findOrgIdStringsByUser(userId: types.Uuid): Promise<string[]> {
    const ids = await this.findOrgIdsByUser(userId);
    return ids.map(id => id.toString());
  }


  async getLastSeen(roomId: types.Uuid, userId: types.Uuid) {
    const res = await this.model.find({ roomId, userId });
    const row = res.first() as RoomMemberEntity | null;
    return row?.lastSeenMessageId ?? null;
  }

  async get(roomId: types.Uuid, userId: types.Uuid) {
    return await this.model.find({ roomId, userId });
  }

  async updateLastSeen(
    roomId: types.TimeUuid,
    userId: types.Uuid,
    lastId: types.TimeUuid,
    orgId: types.Uuid,
  ) {
    // Update last_seen in all denormalized tables
    const queries = [
      {
        query: 'UPDATE chat.room_members SET last_seen_message_id = ? WHERE room_id = ? AND user_id = ?',
        params: [lastId, roomId, userId],
      },
      {
        query: 'UPDATE chat.user_rooms SET last_seen_message_id = ? WHERE user_id = ? AND org_id = ? AND room_id = ?',
        params: [lastId, userId, orgId, roomId],
      },
    ];

    // Note: We also need to update user_project_rooms and user_dms if applicable
    // But we need projectId and roomType info. For now, update those separately if needed.
    // Or we can query first to get that info (trade-off: more reads vs more params)

    await this.client.batch(queries, { prepare: true });
  }

  async updateLastSeenWithRoomInfo(
    roomId: types.TimeUuid,
    userId: types.Uuid,
    lastId: types.TimeUuid,
    orgId: types.Uuid,
    roomType: 'channel' | 'dm',
    projectId?: types.Uuid | null,
  ) {
    const queries = [
      {
        query: 'UPDATE chat.room_members SET last_seen_message_id = ? WHERE room_id = ? AND user_id = ?',
        params: [lastId, roomId, userId],
      },
      {
        query: 'UPDATE chat.user_rooms SET last_seen_message_id = ? WHERE user_id = ? AND org_id = ? AND room_id = ?',
        params: [lastId, userId, orgId, roomId],
      },
    ];

    // Update project-specific table if applicable
    if (projectId) {
      queries.push({
        query: 'UPDATE chat.user_project_rooms SET last_seen_message_id = ? WHERE user_id = ? AND org_id = ? AND project_id = ? AND room_id = ?',
        params: [lastId, userId, orgId, projectId, roomId],
      });
    }

    // Update DMs table if applicable
    if (roomType === 'dm') {
      queries.push({
        query: 'UPDATE chat.user_dms SET last_seen_message_id = ? WHERE user_id = ? AND org_id = ? AND room_id = ?',
        params: [lastId, userId, orgId, roomId],
      });
    }

    await this.client.batch(queries, { prepare: true });
  }

  async updateLastSeenIfNewer(
    roomId: types.TimeUuid,
    userId: types.Uuid,
    messageId: types.TimeUuid,
    orgId: types.Uuid,
  ) {
    const res = await this.model.find({ roomId, userId });
    const row = res.first() as RoomMemberEntity | null;

    const shouldUpdate =
      !row?.lastSeenMessageId ||
      row.lastSeenMessageId.getDate() < messageId.getDate();

    if (shouldUpdate) {
      await this.updateLastSeen(roomId, userId, messageId, orgId);
    }
  }

  /**
   * Find all members of a room
   */
  async findMembersByRoom(
    roomId: types.TimeUuid,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: RoomMemberEntity[]; pagingState?: string }> {
    // Use raw query since mapper.find doesn't support pagination well
    const query = 'SELECT room_id, user_id, org_id, last_seen_message_id FROM chat.room_members WHERE room_id = ?';
    const rs = await this.client.execute(query, [roomId], {
      prepare: true,
      fetchSize: opts.limit ?? 100,
      pageState: opts.pagingState,
    });

    const items: RoomMemberEntity[] = rs.rows.map(row => ({
      roomId: row['room_id'] as types.TimeUuid,
      userId: row['user_id'] as types.Uuid,
      orgId: row['org_id'] as types.Uuid,
      lastSeenMessageId: row['last_seen_message_id'] as types.TimeUuid | undefined,
    }));

    return {
      items,
      pagingState: rs.pageState ?? undefined
    };
  }
}
