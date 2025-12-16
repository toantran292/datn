import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailModule } from '../email/email.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [EmailModule, WebsocketModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
