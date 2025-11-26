import { Module, forwardRef } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomsRepository } from './repositories/room.repository';
import { RoomMembersRepository } from './repositories/room-members.repository';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository, RoomMembersRepository],
  exports: [RoomsService, RoomMembersRepository],
})
export class RoomsModule { }
