// Risk Detector Types matching backend DTOs

export type RiskSeverity = 'CRITICAL' | 'MEDIUM' | 'LOW';
export type RiskAlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
export type RecommendationStatus = 'PENDING' | 'APPLIED' | 'REJECTED';

export enum RiskType {
  OVERCOMMITMENT = 'OVERCOMMITMENT',
  BLOCKED_ISSUES = 'BLOCKED_ISSUES',
  ZERO_PROGRESS = 'ZERO_PROGRESS',
  MISSING_ESTIMATES = 'MISSING_ESTIMATES',
  WORKLOAD_IMBALANCE = 'WORKLOAD_IMBALANCE',
}

export interface RiskRecommendation {
  id?: string;
  riskAlertId?: string;
  priority: number;
  action: string;
  expectedImpact: string;
  effortEstimate?: string;
  suggestedIssues?: string[];
  status?: RecommendationStatus;
  appliedAt?: string;
}

export interface RiskAlert {
  id: string;
  sprintId: string;
  projectId: string;
  riskType: RiskType;
  severity: RiskSeverity;
  title: string;
  description: string;
  impactScore?: number;
  status: RiskAlertStatus;
  affectedIssues?: string[];
  metadata?: Record<string, any>;
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  dismissedAt?: string;
  recommendations?: RiskRecommendation[];
}

export interface RiskSummary {
  total: number;
  critical: number;
  medium: number;
  low: number;
}

export interface GetSprintRisksResponse {
  success: boolean;
  risks: RiskAlert[];
  summary: RiskSummary;
}

export interface DetectRisksResponse {
  success: boolean;
  detectedRisks: number;
  risks: RiskAlert[];
}

export interface AcknowledgeRiskRequest {
  notes?: string;
}

export interface AcknowledgeRiskResponse {
  success: boolean;
  risk: RiskAlert;
}

export interface ResolveRiskRequest {
  resolution: string;
  actionsTaken?: string[];
}

export interface ResolveRiskResponse {
  success: boolean;
  risk: RiskAlert;
}

export interface DismissRiskRequest {
  reason: string;
}

export interface DismissRiskResponse {
  success: boolean;
  risk: RiskAlert;
}

export interface ApplyRecommendationRequest {
  note?: string;
}

export interface ApplyRecommendationResponse {
  success: boolean;
  recommendationId: string;
  issuesMoved: number;
  movedIssueIds?: string[];
}

// Sprint Health Types
export interface SprintHealthMetrics {
  commitmentScore: number;
  progressScore: number;
  velocityScore: number;
  qualityScore: number;
  balanceScore: number;
}

export interface SprintHealthSnapshot {
  id: string;
  sprintId: string;
  projectId: string;
  overallScore: number;
  metrics: SprintHealthMetrics;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface GetSprintHealthResponse {
  success: boolean;
  health: SprintHealthSnapshot;
}

export interface GetSprintHealthHistoryResponse {
  success: boolean;
  history: SprintHealthSnapshot[];
}

// Risk severity color mapping for UI
export const RiskSeverityColors: Record<RiskSeverity, string> = {
  CRITICAL: 'red',
  MEDIUM: 'yellow',
  LOW: 'blue',
};

// Risk severity labels in Vietnamese
export const RiskSeverityLabels: Record<RiskSeverity, string> = {
  CRITICAL: 'Nghiêm Trọng',
  MEDIUM: 'Trung Bình',
  LOW: 'Thấp',
};

// Risk type labels in Vietnamese
export const RiskTypeLabels: Record<RiskType, string> = {
  [RiskType.OVERCOMMITMENT]: 'Sprint Overcommitment',
  [RiskType.BLOCKED_ISSUES]: 'Issues bị Block',
  [RiskType.ZERO_PROGRESS]: 'Không có Progress',
  [RiskType.MISSING_ESTIMATES]: 'Thiếu Story Points',
  [RiskType.WORKLOAD_IMBALANCE]: 'Workload không cân bằng',
};

// Risk type icons for UI
export const RiskTypeIcons: Record<RiskType, string> = {
  [RiskType.OVERCOMMITMENT]: '⚠️',
  [RiskType.BLOCKED_ISSUES]: '🚫',
  [RiskType.ZERO_PROGRESS]: '⏸️',
  [RiskType.MISSING_ESTIMATES]: '❓',
  [RiskType.WORKLOAD_IMBALANCE]: '⚖️',
};
