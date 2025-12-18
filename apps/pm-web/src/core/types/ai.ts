// AI Types for Issue Description Refinement
import type { TIssueType, TIssuePriority } from './issue';

// Re-export issue types for convenience
export type IssueType = TIssueType;
export type IssuePriority = TIssuePriority;

export interface RefineDescriptionContext {
  projectName?: string;
  sprintGoal?: string;
}

export interface RefineDescriptionRequest {
  issueId: string;
  currentDescription: string;
  issueName: string;
  issueType: IssueType;
  priority: IssuePriority;
  context?: RefineDescriptionContext;
}

export interface RefineDescriptionData {
  refinedDescription: string;
  refinedDescriptionHtml: string;
  improvements: string[];
  confidence: number;
}

export interface RefineDescriptionMetadata {
  model: string;
  tokensUsed: number;
  processingTime: number;
}

export interface RefineDescriptionResponse {
  success: boolean;
  data?: RefineDescriptionData;
  metadata?: RefineDescriptionMetadata;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// AI Types for Story Points Estimation

export interface EstimatePointsContext {
  projectName?: string;
  sprintGoal?: string;
}

export interface EstimatePointsRequest {
  issueId: string;
  issueName: string;
  issueType: IssueType;
  priority: IssuePriority;
  currentDescription: string;
  acceptanceCriteriaCount?: number;
  context?: EstimatePointsContext;
}

export interface EstimationFactor {
  factor: string;
  impact: 'Low' | 'Medium' | 'High';
  description: string;
}

export interface EstimationReasoning {
  summary: string;
  factors: EstimationFactor[];
  recommendations?: string[];
}

export interface AlternativeEstimate {
  points: number;
  likelihood: number;
  reason: string;
}

export interface EstimatePointsData {
  suggestedPoints: number;
  confidence: number;
  reasoning: EstimationReasoning;
  alternatives?: AlternativeEstimate[];
}

export interface EstimatePointsMetadata {
  model: string;
  tokensUsed: number;
  processingTime: number;
}

export interface EstimatePointsResponse {
  success: boolean;
  data?: EstimatePointsData;
  metadata?: EstimatePointsMetadata;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// AI Types for Issue Breakdown

export type TaskType = "FEATURE" | "TESTING" | "INFRA" | "DOCS" | "BUGFIX";
export type TechnicalLayer = "FRONTEND" | "BACKEND" | "DATABASE" | "DEVOPS" | "CROSS";

export interface BreakdownContext {
  projectName?: string;
  sprintGoal?: string;
  technicalStack?: string[];
  teamSize?: number;
}

export interface BreakdownConstraints {
  maxSubTasks?: number;
  targetPointsPerTask?: number;
  includeTests?: boolean;
  includeDocs?: boolean;
}

export interface BreakdownIssueRequest {
  issueId: string;
  issueName: string;
  issueType: IssueType;
  priority: IssuePriority;
  currentDescription: string;
  context?: BreakdownContext;
  constraints?: BreakdownConstraints;
}

export interface SubTask {
  tempId: string;
  name: string;
  description: string;
  descriptionHtml: string;
  estimatedPoints: number;
  estimationReasoning: string;
  taskType: TaskType;
  technicalLayer: TechnicalLayer;
  order: number;
  dependencies: string[];
  canParallelize: boolean;
  priority: IssuePriority;
  acceptanceCriteria?: string[];
  tags?: string[];
}

export interface CoverageArea {
  area: string;
  covered: boolean;
  tasks: string[];
  completeness: number;
}

export interface BreakdownReasoning {
  summary: string;
  coverageAreas: CoverageArea[];
  assumptions: string[];
  risks: string[];
}

export interface BreakdownValidation {
  totalPoints: number;
  completeness: number;
  balanceScore: number;
  coveragePercentage: number;
}

export interface DependencyGraphNode {
  id: string;
  label: string;
}

export interface DependencyGraphEdge {
  from: string;
  to: string;
  type: "sequential" | "blocking";
}

export interface DependencyGraph {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
}

export interface BreakdownData {
  subTasks: SubTask[];
  reasoning: BreakdownReasoning;
  validation: BreakdownValidation;
  dependencyGraph?: DependencyGraph;
}

export interface BreakdownMetadata {
  model: string;
  tokensUsed: number;
  processingTime: number;
  cacheHit: boolean;
  timestamp: string;
}

export interface BreakdownIssueResponse {
  success: boolean;
  data?: BreakdownData;
  metadata?: BreakdownMetadata;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
