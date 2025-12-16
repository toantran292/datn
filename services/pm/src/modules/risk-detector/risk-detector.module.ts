import { Module } from '@nestjs/common';
import { RiskDetectorController } from './risk-detector.controller';
import { RiskDetectorService } from './risk-detector.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { RagModule } from '../rag/rag.module';

// Risk detection rules
import { OvercommitmentRule, BlockedIssuesRule } from './rules';

@Module({
  imports: [PrismaModule, AIModule, RagModule],
  controllers: [RiskDetectorController],
  providers: [
    RiskDetectorService,
    // Register all risk rules as providers
    OvercommitmentRule,
    BlockedIssuesRule,
    // TODO: Add other rules when implemented
  ],
  exports: [RiskDetectorService],
})
export class RiskDetectorModule {}
