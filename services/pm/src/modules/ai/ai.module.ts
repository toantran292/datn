import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { OpenAIService } from './openai.service';
import { PromptService } from './prompt.service';
import { AISprintSummaryService } from './ai-sprint-summary.service';
import { FileStorageModule } from '../../common/file-storage/file-storage.module';

@Module({
  imports: [
    ConfigModule,
    FileStorageModule,
    CacheModule.register({
      // Using in-memory cache for now due to cache-manager-redis-store compatibility issues
      // TODO: Upgrade to cache-manager-ioredis-yet or cache-manager-redis-yet for Redis support
      ttl: 86400 * 1000, // 24 hours in milliseconds (cache-manager v5 uses ms)
      max: 1000, // Maximum number of items in cache
    }),
  ],
  controllers: [AIController],
  providers: [AIService, OpenAIService, PromptService, AISprintSummaryService],
  exports: [AIService, OpenAIService, AISprintSummaryService],
})
export class AIModule {}
