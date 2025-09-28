import { Inject, Injectable } from '@nestjs/common';
import { mapping, types } from 'cassandra-driver';
import { CASS_MAPPER } from '../../cassandra/cassandra.module';

export interface RoomEntity {
  id: types.TimeUuid;
  orgId: types.Uuid;
  isPrivate: boolean;
}

@Injectable()
export class RoomRepository {
  private model: mapping.ModelMapper<RoomEntity>;

  constructor(@Inject(CASS_MAPPER) mapper: mapping.Mapper) {
    this.model = mapper.forModel<RoomEntity>('Room');
  }

  async create(orgId: types.Uuid, isPrivate: boolean) {
    const entity: RoomEntity = {
      id: types.TimeUuid.now(),
      orgId: orgId,
      isPrivate: isPrivate,
    };
    await this.model.insert(entity);
    return entity;
  }
}
