import { Inject, Injectable } from '@nestjs/common';
import { mapping, types } from 'cassandra-driver';
import { CASS_MAPPER } from '../../cassandra/cassandra.module';

export interface RoomMemberEntity {
  roomId: types.TimeUuid;
  userId: types.Uuid;
  orgId: types.Uuid;
  lastSeenMessageId?: types.TimeUuid;
}

@Injectable()
export class RoomMembersRepository {
  private model: mapping.ModelMapper<RoomMemberEntity>;

  constructor(@Inject(CASS_MAPPER) mapper: mapping.Mapper) {
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
}
