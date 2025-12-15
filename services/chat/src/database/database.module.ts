import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { RoomMember } from './entities/room-member.entity';
import { Message } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { PinnedMessage } from './entities/pinned-message.entity';
import { ChannelNotificationSetting } from './entities/channel-notification-setting.entity';
import { MessageAttachment } from './entities/message-attachment.entity';
import { ChannelAIConfig } from './entities/channel-ai-config.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST', 'localhost'),
        port: configService.get<number>('POSTGRES_PORT', 5432),
        username: configService.get<string>('POSTGRES_USER', 'postgres'),
        password: configService.get<string>('POSTGRES_PASSWORD', 'postgres'),
        database: configService.get<string>('POSTGRES_DB', 'chat'),
        entities: [
          Room,
          RoomMember,
          Message,
          MessageReaction,
          PinnedMessage,
          ChannelNotificationSetting,
          MessageAttachment,
          ChannelAIConfig,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([
      Room,
      RoomMember,
      Message,
      MessageReaction,
      PinnedMessage,
      ChannelNotificationSetting,
      MessageAttachment,
      ChannelAIConfig,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
