import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { LLMService } from './llm.service';
import { ChannelAIConfigRepository } from './repositories/channel-ai-config.repository';
import { DocumentSummaryRepository } from './repositories/document-summary.repository';
import { ChannelAIConfig } from '../database/entities/channel-ai-config.entity';
import { DocumentSummary } from '../database/entities/document-summary.entity';
import { ChatModule } from '../chat/chat.module';
import { RoomsModule } from '../rooms/rooms.module';
import { FileStorageModule } from '../common/file-storage/file-storage.module';
import { IdentityModule } from '../common/identity/identity.module';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ChannelAIConfig, DocumentSummary]),
    forwardRef(() => ChatModule),
    forwardRef(() => RoomsModule),
    FileStorageModule,
    IdentityModule,
    RagModule,
  ],
  controllers: [AIController],
  providers: [
    AIService,
    LLMService,
    ChannelAIConfigRepository,
    DocumentSummaryRepository,
  ],
  exports: [AIService, LLMService, RagModule],
})
export class AIModule {}
