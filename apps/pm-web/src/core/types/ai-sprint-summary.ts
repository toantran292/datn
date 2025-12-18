/**
 * AI Sprint Summary Types
 * Types for AI-powered sprint analysis and summary generation
 */

export type SprintSentiment = "positive" | "neutral" | "needs_improvement";
export type ToneType = "professional" | "friendly" | "motivational";
export type SeverityLevel = "low" | "medium" | "high";
export type PriorityLevel = "low" | "medium" | "high";

export interface SprintOverview {
  sprintName: string;
  startDate: string;
  endDate: string;
  duration: number; // days
  completionRate: number; // 0-1
  velocityScore: number; // story points
  overallSentiment: SprintSentiment;
}

export interface PositiveHighlight {
  title: string;
  description: string;
  metric?: {
    value: number;
    change?: number; // % change from previous sprint
    unit?: string; // e.g., "%", "points", "issues"
  };
}

export interface AreaOfConcern {
  title: string;
  description: string;
  severity: SeverityLevel;
}

export interface Recommendation {
  title: string;
  description: string;
  actionable: boolean;
  priority: PriorityLevel;
}

export interface Strength {
  title: string;
  description: string;
}

export interface SprintMetadata {
  totalIssues: number;
  completedIssues: number;
  totalPoints: number;
  completedPoints: number;
  averageCompletionTime: number; // hours
  bugCount: number;
  velocityTrend: number; // % change from previous sprint
}

export interface SprintSummaryData {
  overview: SprintOverview;
  positives: PositiveHighlight[];
  concerns: AreaOfConcern[];
  recommendations: Recommendation[];
  strengths: Strength[];
  closingMessage: string;
  metadata: SprintMetadata;
}

export interface SprintSummaryResponse {
  success: boolean;
  summary: SprintSummaryData;
  confidence: number; // 0-1
}

// Request types
export interface SprintSummaryRequest {
  sprintId: string;
  includeMetrics?: boolean;
  includeRecommendations?: boolean;
  tone?: ToneType;
}

// Stream event types for progressive display
export type SprintSummaryStreamEventType =
  | "overview"
  | "positive"
  | "concern"
  | "recommendation"
  | "strength"
  | "closing"
  | "metadata"
  | "complete"
  | "error"
  | "progress";

export interface SprintSummaryStreamEvent {
  type: SprintSummaryStreamEventType;
  value?: any;
  message?: string;
}
