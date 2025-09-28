import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomRepository } from './repositories/room.repository';
import { RoomMembersRepository } from './repositories/room-members.repository';
import { UsersModule } from '../users/users.module';
import { UsersRepository } from '../users/users.repository';
import { ChatGateway } from '../chat/chat.gateway';
import { ChatService } from '../chat/chat.service';
import { ChatModule } from '../chat/chat.module';
import { MessagesRepository } from 'src/chat/repositories/messages.repository';

@Module({
  imports: [UsersModule, ChatModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomRepository, RoomMembersRepository, UsersRepository, ChatGateway, ChatService, MessagesRepository],
  exports: [RoomsService],
})
export class RoomsModule { }
