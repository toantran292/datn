import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { LLMService } from './llm.service';
import { ChannelAIConfigRepository } from './repositories/channel-ai-config.repository';
import { ChannelAIConfig } from '../database/entities/channel-ai-config.entity';
import { ChatModule } from '../chat/chat.module';
import { RoomsModule } from '../rooms/rooms.module';
import { FileStorageModule } from '../common/file-storage/file-storage.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ChannelAIConfig]),
    forwardRef(() => ChatModule),
    forwardRef(() => RoomsModule),
    FileStorageModule,
  ],
  controllers: [AIController],
  providers: [
    AIService,
    LLMService,
    ChannelAIConfigRepository,
  ],
  exports: [AIService, LLMService],
})
export class AIModule {}
