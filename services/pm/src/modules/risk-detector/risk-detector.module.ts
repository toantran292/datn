import { Module } from '@nestjs/common';
import { RiskDetectorController } from './risk-detector.controller';
import { RiskDetectorService } from './risk-detector.service';
import { AIRiskAnalyzerService } from './ai-risk-analyzer.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { RagModule } from '../rag/rag.module';

// Risk detection rules (for fallback)
import { OvercommitmentRule, BlockedIssuesRule } from './rules';

@Module({
  imports: [PrismaModule, AIModule, RagModule],
  controllers: [RiskDetectorController],
  providers: [
    RiskDetectorService,
    AIRiskAnalyzerService, // AI-powered risk analyzer (PRIMARY)
    // Rules for fallback
    OvercommitmentRule,
    BlockedIssuesRule,
  ],
  exports: [RiskDetectorService],
})
export class RiskDetectorModule {}
