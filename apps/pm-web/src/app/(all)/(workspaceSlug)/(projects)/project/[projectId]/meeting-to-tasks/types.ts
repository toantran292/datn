export enum TaskType {
  BUG = 'bug',
  TASK = 'task',
  STORY = 'story',
  FEATURE = 'feature',
}

export enum TaskPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface TaskPreview {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  order: number;
  estimatedPoints: number;
  suggestedAssignee?: string;
  assigneeId?: string;
  dependencies: number[];
  context: string;
}

export interface AnalyzeMeetingResponse {
  meetingId: string;
  transcript: string;
  tasks: TaskPreview[];
  stats: {
    totalTasks: number;
    totalPoints: number;
    byPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
    byType: {
      bug: number;
      task: number;
      story: number;
      feature: number;
    };
  };
}

export interface CreatedTask {
  tempId: string;
  issueId: string;
  issueKey: string;
  title: string;
}

export interface FailedTask {
  tempId: string;
  title: string;
  error: string;
  code?: string;
}

export interface BulkCreateTasksResponse {
  success: boolean;
  stats: {
    total: number;
    succeeded: number;
    failed: number;
  };
  created: CreatedTask[];
  failed: FailedTask[];
}
