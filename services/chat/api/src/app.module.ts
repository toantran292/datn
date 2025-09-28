import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CassandraModule } from "./cassandra/cassandra.module";
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { RoomsModule } from './rooms/rooms.module';
import { RequestContextGuard } from './common/context/request-context.guard';
import { APP_GUARD, Reflector } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    CassandraModule,
    UsersModule,
    ChatModule,
    RoomsModule,
  ],
  controllers: [],
  providers: [Reflector,
    { provide: APP_GUARD, useClass: RequestContextGuard },],
})
export class AppModule { }
