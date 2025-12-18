import { Injectable, Logger } from '@nestjs/common';
import {
  IRiskRule,
  RiskCategory,
  RiskResult,
  SprintContext,
} from '../interfaces/risk-rule.interface';
import { RiskSeverity } from '../dto';

/**
 * Detects long-running blocked issues
 *
 * TODO: Implement this rule
 * Rule Logic:
 * - Find issues with state = 'BLOCKED'
 * - Check how long they've been blocked (need to track state change timestamp)
 * - If blocked > 72 hours (3 days) → MEDIUM or CRITICAL risk
 */
@Injectable()
export class BlockedIssuesRule implements IRiskRule {
  private readonly logger = new Logger(BlockedIssuesRule.name);

  readonly id = 'BLOCKED_ISSUES';
  readonly name = 'Long-Running Blocked Issues';
  readonly category = RiskCategory.PROGRESS;
  readonly severity = RiskSeverity.MEDIUM;

  check(context: SprintContext): RiskResult | null {
    // TODO: Implement blocked issues detection
    // Hint: Need to add stateChangedAt field to Issue model or query IssueActivity

    return null; // Not implemented yet
  }
}
