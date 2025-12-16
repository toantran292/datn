export enum ReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ReportType {
  SUMMARY = 'SUMMARY',
  ANALYSIS = 'ANALYSIS',
  EXTRACTION = 'EXTRACTION',
  COMPARISON = 'COMPARISON',
  CUSTOM = 'CUSTOM',
}

export enum LlmProvider {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  GOOGLE = 'GOOGLE',
}

export interface Report {
  id: string;
  orgId: string;
  createdBy: string;
  name: string;
  description?: string;
  type: ReportType;
  status: ReportStatus;
  llmProvider?: LlmProvider;
  llmModel?: string;
  prompt?: string;
  content?: string;
  errorMessage?: string;
  fileIds: string[];
  config: Record<string, any>;
  tokenUsage?: Record<string, any>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export const ReportTypeDescriptions: Record<ReportType, string> = {
  [ReportType.SUMMARY]: 'Generate a summary of the provided documents',
  [ReportType.ANALYSIS]: 'Analyze the documents and provide insights',
  [ReportType.EXTRACTION]: 'Extract specific information from documents',
  [ReportType.COMPARISON]: 'Compare and contrast multiple documents',
  [ReportType.CUSTOM]: 'Generate report based on custom prompt',
};
