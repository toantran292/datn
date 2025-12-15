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
