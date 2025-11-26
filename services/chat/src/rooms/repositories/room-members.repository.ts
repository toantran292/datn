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

  async addMember(roomId: types.TimeUuid, userId: types.Uuid, orgId: types.Uuid) {
    const row: RoomMemberEntity = { roomId, userId, orgId };
    await this.model.insert(row);
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
  ) {
    const query =
      'UPDATE chat.room_members SET last_seen_message_id = ? WHERE room_id = ? AND user_id = ?';
    await this.client.execute(query, [lastId, roomId, userId], { prepare: true });
  }

  async updateLastSeenIfNewer(
    roomId: types.TimeUuid,
    userId: types.Uuid,
    messageId: types.TimeUuid,
  ) {
    const res = await this.model.find({ roomId, userId });
    const row = res.first() as RoomMemberEntity | null;

    const shouldUpdate =
      !row?.lastSeenMessageId ||
      row.lastSeenMessageId.getDate() < messageId.getDate();

    if (shouldUpdate) {
      await this.updateLastSeen(roomId, userId, messageId);
    }
  }
}
