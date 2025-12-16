import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ChatModule } from './chat/chat.module';
import { RoomsModule } from './rooms/rooms.module';
import { InternalModule } from './internal/internal.module';
import { AIModule } from './ai/ai.module';
import { RequestContextGuard } from './common/context/request-context.guard';
import { APP_GUARD, Reflector } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    ChatModule,
    RoomsModule,
    InternalModule,
    AIModule,
  ],
  controllers: [],
  providers: [Reflector,
    { provide: APP_GUARD, useClass: RequestContextGuard },],
})
export class AppModule { }
