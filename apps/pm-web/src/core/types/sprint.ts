export type SprintStatus = "FUTURE" | "ACTIVE" | "CLOSED";

export interface ISprint {
  id: string;
  projectId: string;
  name: string;
  status: SprintStatus;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  issueIds: string[];
}

export type TSprintMap = Record<string, ISprint>;

export type TProjectSprintIdsMap = Record<string, string[]>;

export interface ICreateSprintPayload {
  projectId: string;
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface IUpdateSprintPayload {
  projectId: string;
  name?: string;
  status?: SprintStatus;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}
