import { Module, forwardRef } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { IdentityModule } from '../common/identity/identity.module';
import { PresenceModule } from '../common/presence/presence.module';
import { ChatModule } from '../chat/chat.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [
    IdentityModule,
    PresenceModule,
    forwardRef(() => ChatModule),
    RoomsModule,
  ],
  controllers: [InternalController],
})
export class InternalModule {}

