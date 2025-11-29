import { Inject, Injectable } from '@nestjs/common';
import { mapping, types, Client } from 'cassandra-driver';
import { CASS_MAPPER, CASS_CLIENT } from '../../cassandra/cassandra.module';

export type RoomType = 'channel' | 'dm';

export interface RoomEntity {
  id: types.TimeUuid;
  orgId: types.Uuid;
  isPrivate: boolean;
  name: string | undefined;
  type: RoomType;
  projectId?: types.Uuid | null; // null = org-level, uuid = project-specific
}

export interface UserRoomEntity {
  userId: types.Uuid;
  orgId: types.Uuid;
  roomId: types.TimeUuid;
  roomType: RoomType;
  roomName: string | undefined;
  isPrivate: boolean;
  projectId?: types.Uuid | null;
  joinedAt: Date;
  lastSeenMessageId?: types.TimeUuid;
}

@Injectable()
export class RoomsRepository {
  private model: mapping.ModelMapper<RoomEntity>;

  constructor(@Inject(CASS_MAPPER) mapper: mapping.Mapper,
    @Inject(CASS_CLIENT) private readonly client: Client,
  ) {
    this.model = mapper.forModel<RoomEntity>('Room');
  }

  async create(
    orgId: types.Uuid,
    isPrivate: boolean,
    name: string | undefined,
    type: RoomType = 'channel',
    projectId?: types.Uuid | null
  ) {
    const entity: RoomEntity = {
      id: types.TimeUuid.now(),
      orgId: orgId,
      isPrivate: isPrivate,
      name: name,
      type: type,
      projectId: projectId || null,
    };
    await this.model.insert(entity);
    return entity;
  }

  async findByOrgAndId(orgId: types.Uuid, roomId: types.TimeUuid) {
    const res = await this.model.find({ orgId, id: roomId });
    return res.first() as RoomEntity | null;
  }

  async findByIds(orgId: types.Uuid, ids: types.TimeUuid[]): Promise<RoomEntity[]> {
    if (!ids?.length) return [];
    const out: RoomEntity[] = [];
    for (const id of ids) {
      const res = await this.model.find({ orgId, id });
      const row = res.first() as RoomEntity | null;
      if (row) out.push(row);
    }
    return out;
  }

  async listByOrg(
    orgId: types.Uuid,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: RoomEntity[]; pagingState?: string }> {
    const q = 'SELECT org_id, id, is_private, name, type, project_id FROM chat.rooms WHERE org_id = ?';
    const rs = await this.client.execute(q, [orgId], {
      prepare: true,
      fetchSize: opts.limit ?? 50,
      pageState: opts.pagingState,
    });
    const items = rs.rows.map(r => ({
      orgId: r['org_id'] as types.Uuid,
      id: r['id'] as types.TimeUuid,
      isPrivate: r['is_private'] as boolean,
      name: r['name'] as string | undefined,
      type: (r['type'] as RoomType) || 'channel', // Default to 'channel' for existing rows
      projectId: r['project_id'] as types.Uuid | null | undefined,
    }));
    return { items, pagingState: rs.pageState ?? undefined };
  }

  /**
   * Get joined rooms for a user in an org
   * Uses denormalized user_rooms table for fast lookup
   */
  async listJoinedRoomsByUser(
    userId: types.Uuid,
    orgId: types.Uuid,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: UserRoomEntity[]; pagingState?: string }> {
    const query = `
      SELECT user_id, org_id, room_id, room_type, room_name, is_private,
             project_id, joined_at, last_seen_message_id
      FROM chat.user_rooms
      WHERE user_id = ? AND org_id = ?
    `;
    const rs = await this.client.execute(query, [userId, orgId], {
      prepare: true,
      fetchSize: opts.limit ?? 50,
      pageState: opts.pagingState,
    });

    const items: UserRoomEntity[] = rs.rows.map(r => ({
      userId: r['user_id'] as types.Uuid,
      orgId: r['org_id'] as types.Uuid,
      roomId: r['room_id'] as types.TimeUuid,
      roomType: (r['room_type'] as RoomType) || 'channel',
      roomName: r['room_name'] as string | undefined,
      isPrivate: r['is_private'] as boolean,
      projectId: r['project_id'] as types.Uuid | null | undefined,
      joinedAt: r['joined_at'] as Date,
      lastSeenMessageId: r['last_seen_message_id'] as types.TimeUuid | undefined,
    }));

    return { items, pagingState: rs.pageState ?? undefined };
  }

  /**
   * Get joined rooms for a user in an org + project
   * Uses denormalized user_project_rooms table for fast lookup
   */
  async listJoinedRoomsByUserAndProject(
    userId: types.Uuid,
    orgId: types.Uuid,
    projectId: types.Uuid,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: UserRoomEntity[]; pagingState?: string }> {
    const query = `
      SELECT user_id, org_id, room_id, room_type, room_name, is_private,
             project_id, joined_at, last_seen_message_id
      FROM chat.user_project_rooms
      WHERE user_id = ? AND org_id = ? AND project_id = ?
    `;
    const rs = await this.client.execute(query, [userId, orgId, projectId], {
      prepare: true,
      fetchSize: opts.limit ?? 50,
      pageState: opts.pagingState,
    });

    const items: UserRoomEntity[] = rs.rows.map(r => ({
      userId: r['user_id'] as types.Uuid,
      orgId: r['org_id'] as types.Uuid,
      roomId: r['room_id'] as types.TimeUuid,
      roomType: (r['room_type'] as RoomType) || 'channel',
      roomName: r['room_name'] as string | undefined,
      isPrivate: r['is_private'] as boolean,
      projectId: r['project_id'] as types.Uuid | null | undefined,
      joinedAt: r['joined_at'] as Date,
      lastSeenMessageId: r['last_seen_message_id'] as types.TimeUuid | undefined,
    }));

    return { items, pagingState: rs.pageState ?? undefined };
  }

  /**
   * Get DMs for a user in an org
   * Uses denormalized user_dms table for fast lookup
   */
  async listDmsByUser(
    userId: types.Uuid,
    orgId: types.Uuid,
    opts: { limit?: number; pagingState?: string } = {},
  ): Promise<{ items: UserRoomEntity[]; pagingState?: string }> {
    const query = `
      SELECT user_id, org_id, room_id, room_name, joined_at, last_seen_message_id
      FROM chat.user_dms
      WHERE user_id = ? AND org_id = ?
    `;
    const rs = await this.client.execute(query, [userId, orgId], {
      prepare: true,
      fetchSize: opts.limit ?? 50,
      pageState: opts.pagingState,
    });

    const items: UserRoomEntity[] = rs.rows.map(r => ({
      userId: r['user_id'] as types.Uuid,
      orgId: r['org_id'] as types.Uuid,
      roomId: r['room_id'] as types.TimeUuid,
      roomType: 'dm',
      roomName: r['room_name'] as string | undefined,
      isPrivate: true, // DMs are always private
      projectId: null,
      joinedAt: r['joined_at'] as Date,
      lastSeenMessageId: r['last_seen_message_id'] as types.TimeUuid | undefined,
    }));

    return { items, pagingState: rs.pageState ?? undefined };
  }
}
