export interface IIssueStatus {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  color: string; // Hex color like #FF0000
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type TIssueStatusMap = Record<string, IIssueStatus>;

export type TProjectIssueStatusIdsMap = Record<string, string[]>;

export interface ICreateIssueStatusPayload {
  projectId: string;
  name: string;
  description?: string | null;
  color: string;
  order?: number;
}

export interface IUpdateIssueStatusPayload {
  name?: string;
  description?: string | null;
  color?: string;
  order?: number;
}

