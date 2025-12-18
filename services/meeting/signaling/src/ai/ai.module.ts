import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { TranscriptService } from './transcript.service';
import { PrismaService } from '../prisma.service';
import { RagClientModule } from '../common/rag';

@Module({
  imports: [RagClientModule],
  controllers: [AIController],
  providers: [TranscriptService, PrismaService],
  exports: [TranscriptService],
})
export class AIModule {}
