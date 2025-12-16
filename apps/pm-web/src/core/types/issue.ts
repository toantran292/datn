export type TIssueState = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";

export type TIssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TIssueType = "STORY" | "TASK" | "BUG" | "EPIC";

export interface IIssue {
  id: string;
  projectId: string;
  sprintId: string | null;
  parentId: string | null;
  statusId: string;
  name: string;
  description: string | null;
  descriptionHtml: string | null;
  state: TIssueState; // Deprecated: use statusId instead
  priority: TIssuePriority;
  type: TIssueType;
  point: number | null;
  sequenceId: number;
  sortOrder: number | null;
  startDate: string | null;
  targetDate: string | null;
  assignees: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type TIssueMap = Record<string, IIssue>;

export type TProjectIssueIdsMap = Record<string, string[]>;

export interface ICreateIssuePayload {
  projectId: string;
  sprintId?: string | null;
  parentId?: string | null;
  name: string;
  description?: string | null;
  descriptionHtml?: string | null;
  priority: TIssuePriority;
  type: TIssueType;
  point?: number | null;
  sequenceId?: number | null;
  sortOrder?: number | null;
  startDate?: string | null;
  targetDate?: string | null;
  assignees: string[];
}


export interface IReorderIssuePayload {
  issueId: string;
  fromSectionId: string | null;
  toSectionId: string | null;
  destinationIssueId: string | null;
  position: "before" | "after" | "end";
}
