import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DocumentEmbedding } from '../../database/entities/document-embedding.entity';
import { EmbeddingService } from './embedding.service';
import { EmbeddingRepository } from './embedding.repository';
import { DocumentProcessorService } from './document-processor.service';
import { TextProcessor } from './processors/text.processor';
import { PdfProcessor } from './processors/pdf.processor';
import { RagService } from './rag.service';
import { ChatModule } from '../../chat/chat.module';
import { FileStorageModule } from '../../common/file-storage/file-storage.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([DocumentEmbedding]),
    forwardRef(() => ChatModule),
    FileStorageModule,
  ],
  providers: [
    EmbeddingService,
    EmbeddingRepository,
    DocumentProcessorService,
    TextProcessor,
    PdfProcessor,
    RagService,
    {
      provide: 'RagService',
      useExisting: RagService,
    },
  ],
  exports: [EmbeddingService, DocumentProcessorService, RagService, 'RagService'],
})
export class RagModule {}
