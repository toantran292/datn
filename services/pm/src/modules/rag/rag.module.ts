import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { RagCronService } from './rag-cron.service';
import { RagController } from './rag.controller';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [RagController],
  providers: [RagService, EmbeddingService, RagCronService],
  exports: [RagService],
})
export class RagModule {}
