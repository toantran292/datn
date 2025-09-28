import { Inject, Injectable } from '@nestjs/common';
import { mapping, types } from 'cassandra-driver';
import { CASS_MAPPER } from '../cassandra/cassandra.module';

export interface UserEntity {
  id: types.Uuid;
  displayName?: string;
  orgId: types.Uuid;
}

@Injectable()
export class UsersRepository {
  private userModel: mapping.ModelMapper<UserEntity>;

  constructor(@Inject(CASS_MAPPER) mapper: mapping.Mapper) {
    this.userModel = mapper.forModel<UserEntity>('User');
  }

  async create(user: UserEntity) {
    await this.userModel.insert(user);
    return user;
  }

  async findById(id: types.Uuid) {
    const res = await this.userModel.find({ id });
    return res.first();
  }
}
