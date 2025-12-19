import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingAnalysisService } from './meeting-analysis.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { IssueModule } from '../issue/issue.module';

@Module({
  imports: [PrismaModule, AIModule, IssueModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingAnalysisService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
