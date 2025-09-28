import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CassandraModule } from '../cassandra/cassandra.module';

@Module({
  imports: [CassandraModule],
  providers: [UsersRepository, UsersService],
  controllers: [UsersController],
  exports: [UsersRepository],
})
export class UsersModule { }
