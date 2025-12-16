import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { StoredNotificationController } from './stored-notification.controller';
import { StoredNotificationService } from './stored-notification.service';
import { EmailModule } from '../email/email.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [EmailModule, WebsocketModule, PersistenceModule],
  controllers: [NotificationController, StoredNotificationController],
  providers: [NotificationService, StoredNotificationService],
  exports: [StoredNotificationService],
})
export class NotificationModule {}
