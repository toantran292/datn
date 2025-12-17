import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { LLMService } from './llm.service';
import { TranscriptService } from './transcript.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AIController],
  providers: [LLMService, TranscriptService, PrismaService],
  exports: [LLMService, TranscriptService],
})
export class AIModule {}
