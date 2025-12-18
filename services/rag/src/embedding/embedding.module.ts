import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEmbedding } from '../database/entities/document-embedding.entity';
import { EmbeddingService } from './embedding.service';
import { EmbeddingRepository } from './embedding.repository';
import { EmbeddingController } from './embedding.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([DocumentEmbedding]),
  ],
  controllers: [EmbeddingController],
  providers: [EmbeddingService, EmbeddingRepository],
  exports: [EmbeddingService, EmbeddingRepository],
})
export class EmbeddingModule {}
