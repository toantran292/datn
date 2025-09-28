import { Injectable } from '@nestjs/common';
import { UsersRepository, UserEntity } from './users.repository';
import { types } from 'cassandra-driver';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) { }

  async createUser(id: types.Uuid, orgId: types.Uuid, displayName?: string) {
    const user: UserEntity = {
      id,
      displayName,
      orgId,
    };
    return this.repo.create(user);
  }

  async getUser(id: types.Uuid) {
    return this.repo.findById(id);
  }
}
