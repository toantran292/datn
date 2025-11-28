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
}

@Injectable()
export class RoomsRepository {
  private model: mapping.ModelMapper<RoomEntity>;

  constructor(@Inject(CASS_MAPPER) mapper: mapping.Mapper,
    @Inject(CASS_CLIENT) private readonly client: Client,
  ) {
    this.model = mapper.forModel<RoomEntity>('Room');
  }

  async create(orgId: types.Uuid, isPrivate: boolean, name: string | undefined, type: RoomType = 'channel') {
    const entity: RoomEntity = {
      id: types.TimeUuid.now(),
      orgId: orgId,
      isPrivate: isPrivate,
      name: name,
      type: type,
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
    const q = 'SELECT org_id, id, is_private, name, type FROM chat.rooms WHERE org_id = ?';
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
    }));
    return { items, pagingState: rs.pageState ?? undefined };
  }
}
