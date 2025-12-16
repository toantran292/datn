import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DocumentEmbedding } from '../../database/entities/document-embedding.entity';
import { ChannelAIConfig } from '../../database/entities/channel-ai-config.entity';
import { EmbeddingService } from './embedding.service';
import { EmbeddingRepository } from './embedding.repository';
import { DocumentProcessorService } from './document-processor.service';
import { TextProcessor } from './processors/text.processor';
import { PdfProcessor } from './processors/pdf.processor';
import { AudioProcessor } from './processors/audio.processor';
import { VideoProcessor } from './processors/video.processor';
import { RagService } from './rag.service';
import { LLMService } from '../llm.service';
import { ChannelAIConfigRepository } from '../repositories/channel-ai-config.repository';
import { ChatModule } from '../../chat/chat.module';
import { FileStorageModule } from '../../common/file-storage/file-storage.module';
import { RoomsModule } from '../../rooms/rooms.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([DocumentEmbedding, ChannelAIConfig]),
    forwardRef(() => ChatModule),
    forwardRef(() => RoomsModule),
    FileStorageModule,
  ],
  providers: [
    EmbeddingService,
    EmbeddingRepository,
    DocumentProcessorService,
    TextProcessor,
    PdfProcessor,
    AudioProcessor,
    VideoProcessor,
    LLMService,
    ChannelAIConfigRepository,
    RagService,
    {
      provide: 'RagService',
      useExisting: RagService,
    },
  ],
  exports: [EmbeddingService, DocumentProcessorService, RagService, 'RagService', LLMService, AudioProcessor],
})
export class RagModule {}
