import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmbeddingModule } from '../embedding/embedding.module';
import { DocumentProcessorService } from './document-processor.service';
import { ProcessorController } from './processor.controller';
import { TextProcessor } from './processors/text.processor';
import { PdfProcessor } from './processors/pdf.processor';
import { AudioProcessor } from './processors/audio.processor';
import { VideoProcessor } from './processors/video.processor';

@Module({
  imports: [ConfigModule, EmbeddingModule],
  controllers: [ProcessorController],
  providers: [
    DocumentProcessorService,
    TextProcessor,
    PdfProcessor,
    AudioProcessor,
    VideoProcessor,
  ],
  exports: [
    DocumentProcessorService,
    TextProcessor,
    PdfProcessor,
    AudioProcessor,
    VideoProcessor,
  ],
})
export class ProcessorModule {}
