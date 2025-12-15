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
