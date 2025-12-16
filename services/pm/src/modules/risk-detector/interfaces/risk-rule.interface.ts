import { RiskSeverity } from '../dto';

/**
 * Context data provided to risk detection rules
 */
export interface SprintContext {
  sprint: SprintData;
  issues: IssueData[];
  sprintHistory: SprintHistoryData[];
  teamCapacity?: number;
}

export interface SprintData {
  id: string;
  projectId: string;
  name: string;
  status: 'FUTURE' | 'ACTIVE' | 'CLOSED';
  startDate: Date | null;
  endDate: Date | null;
  initialStoryPoints: number | null;
  velocity: number | null;
}

export interface IssueData {
  id: string;
  projectId: string;
  sprintId: string | null;
  parentId: string | null;
  name: string;
  type: string;
  priority: string;
  point: number | null;
  state: string; // Status name from IssueStatus
  statusId: string;
  assignees: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SprintHistoryData {
  id: string;
  sprintId: string;
  committedPoints: number;
  completedPoints: number;
  velocity: number;
  startDate: Date;
  endDate: Date;
}

/**
 * Result returned by a risk detection rule
 */
export interface RiskResult {
  type: string;
  severity: RiskSeverity;
  title: string;
  description: string;
  impactScore: number;
  affectedIssues?: string[];
  metadata?: Record<string, any>;
  recommendations?: RiskRecommendation[];
}

export interface RiskRecommendation {
  priority: number;
  action: string;
  expectedImpact?: string;
  effortEstimate?: string;
  suggestedIssues?: string[];
}

/**
 * Base interface for all risk detection rules
 */
export interface IRiskRule {
  /**
   * Unique identifier for this rule
   */
  readonly id: string;

  /**
   * Human-readable name
   */
  readonly name: string;

  /**
   * Rule category
   */
  readonly category: RiskCategory;

  /**
   * Default severity (can be overridden by check result)
   */
  readonly severity: RiskSeverity;

  /**
   * Check if this rule detects any risks
   * @param context Sprint context data
   * @returns RiskResult if risk detected, null otherwise
   */
  check(context: SprintContext): Promise<RiskResult | null> | RiskResult | null;
}

export enum RiskCategory {
  CAPACITY = 'CAPACITY',
  PROGRESS = 'PROGRESS',
  QUALITY = 'QUALITY',
  ESTIMATION = 'ESTIMATION',
  DEPENDENCIES = 'DEPENDENCIES',
}
