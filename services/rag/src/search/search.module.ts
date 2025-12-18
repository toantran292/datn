import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmbeddingModule } from '../embedding/embedding.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { LLMService } from './llm.service';

@Module({
  imports: [ConfigModule, EmbeddingModule],
  controllers: [SearchController],
  providers: [SearchService, LLMService],
  exports: [SearchService, LLMService],
})
export class SearchModule {}
