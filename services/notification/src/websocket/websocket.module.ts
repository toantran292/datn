import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { PresenceModule } from '../presence/presence.module';

@Module({
  imports: [PresenceModule],
  providers: [NotificationGateway],
  exports: [NotificationGateway, PresenceModule],
})
export class WebsocketModule {}
