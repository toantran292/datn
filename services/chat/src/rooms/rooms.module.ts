import { Module, forwardRef } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomsRepository } from './repositories/room.repository';
import { RoomMembersRepository } from './repositories/room-members.repository';
import { ChatModule } from '../chat/chat.module';
import { IdentityModule } from '../common/identity/identity.module';
import { PresenceModule } from '../common/presence/presence.module';

@Module({
  imports: [
    forwardRef(() => ChatModule),
    IdentityModule,
    PresenceModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository, RoomMembersRepository],
  exports: [RoomsService, RoomMembersRepository, RoomsRepository],
})
export class RoomsModule { }
