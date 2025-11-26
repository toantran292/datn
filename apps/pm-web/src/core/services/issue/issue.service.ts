import { ICreateIssuePayload, IIssue, IReorderIssuePayload, TIssuePriority, TIssueState, TIssueType } from "@/core/types/issue";

import { APIService } from "../api.service";

type IssueRequestPayload = {
  projectId: string;
  sprintId: string | null;
  parentId: string | null;
  name: string;
  description: string | null;
  descriptionHtml: string | null;
  state: TIssueState;
  priority: TIssuePriority;
  type: TIssueType;
  point: number | null;
  sequenceId: number | null;
  sortOrder: number | null;
  startDate: string | null;
  targetDate: string | null;
  assignees: string[];
};

export class IssueService extends APIService {
  constructor() {
    super();
  }

  async getIssuesByProject(projectId: string): Promise<IIssue[]> {
    return this.get(`/api/projects/${projectId}/issues`)
      .then((response) => {
        const issues: unknown[] = response?.data ?? [];
        return issues.map((issue) => this.normalizeIssue(issue));
      })
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  async createIssue(payload: ICreateIssuePayload): Promise<IIssue> {
    const body = this.mapToRequestPayload({
      projectId: payload.projectId,
      sprintId: payload.sprintId ?? null,
      parentId: payload.parentId ?? null,
      name: payload.name,
      description: payload.description ?? null,
      descriptionHtml: payload.descriptionHtml ?? null,
      state: payload.state,
      priority: payload.priority,
      type: payload.type,
      point: payload.point ?? null,
      sequenceId: payload.sequenceId ?? null,
      sortOrder: payload.sortOrder ?? null,
      startDate: payload.startDate ?? null,
      targetDate: payload.targetDate ?? null,
      assignees: payload.assignees ?? [],
    });

    return this.post(`/api/issues`, body)
      .then((response) => this.normalizeIssue(response?.data))
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  async updateIssue(issue: IIssue): Promise<IIssue> {
    const body = this.mapToRequestPayload({
      projectId: issue.projectId,
      sprintId: issue.sprintId ?? null,
      parentId: issue.parentId ?? null,
      name: issue.name,
      description: issue.description ?? null,
      descriptionHtml: issue.descriptionHtml ?? null,
      state: issue.state,
      priority: issue.priority,
      type: issue.type,
      point: issue.point ?? null,
      sequenceId: issue.sequenceId ?? null,
      sortOrder: issue.sortOrder ?? null,
      startDate: issue.startDate ?? null,
      targetDate: issue.targetDate ?? null,
      assignees: issue.assignees ?? [],
    });

    return this.put(`/api/issues/${issue.id}`, body)
      .then((response) => this.normalizeIssue(response?.data))
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  async reorderIssue(projectId: string, issueId: string, payload: IReorderIssuePayload): Promise<void> {
    await this.post(`/api/projects/${projectId}/issues/${issueId}/reorder`, {
      toSprintId: payload.toSectionId,
      destinationIssueId: payload.destinationIssueId,
      position: payload.position.toUpperCase(),
    });
  }

  private mapToRequestPayload(issue: IssueRequestPayload): IssueRequestPayload {
    return {
      ...issue,
      sprintId: issue.sprintId,
      parentId: issue.parentId,
      description: issue.description,
      descriptionHtml: issue.descriptionHtml,
      point: issue.point,
      sequenceId: issue.sequenceId,
      sortOrder: issue.sortOrder,
      startDate: issue.startDate,
      targetDate: issue.targetDate,
      assignees: issue.assignees,
    };
  }

  private normalizeIssue(rawIssue: unknown): IIssue {
    const issue = rawIssue as Record<string, unknown>;

    return {
      id: String(issue.id ?? ""),
      projectId: String(issue.projectId ?? ""),
      sprintId: issue.sprintId ? String(issue.sprintId) : null,
      parentId: issue.parentId ? String(issue.parentId) : null,
      name: String(issue.name ?? ""),
      description: (issue.description as string | null | undefined) ?? null,
      descriptionHtml: (issue.descriptionHtml as string | null | undefined) ?? null,
      state: this.ensureState(issue.state),
      priority: this.ensurePriority(issue.priority),
      type: this.ensureType(issue.type),
      point: issue.point === null || issue.point === undefined ? null : Number(issue.point),
      sequenceId: issue.sequenceId === null || issue.sequenceId === undefined ? null : Number(issue.sequenceId),
      sortOrder: issue.sortOrder === null || issue.sortOrder === undefined ? null : Number(issue.sortOrder),
      startDate: (issue.startDate as string | null | undefined) ?? null,
      targetDate: (issue.targetDate as string | null | undefined) ?? null,
      assignees: Array.isArray(issue.assignees)
        ? (issue.assignees as unknown[]).map((assignee) => String(assignee))
        : [],
      createdAt: String(issue.createdAt ?? ""),
      updatedAt: String(issue.updatedAt ?? ""),
    };
  }

  private ensureState(value: unknown): TIssueState {
    const allowed: TIssueState[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];
    const normalized = String(value ?? "TODO").toUpperCase();
    return (allowed.includes(normalized as TIssueState) ? normalized : "TODO") as TIssueState;
  }

  private ensurePriority(value: unknown): TIssuePriority {
    const allowed: TIssuePriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const normalized = String(value ?? "MEDIUM").toUpperCase();
    return (allowed.includes(normalized as TIssuePriority) ? normalized : "MEDIUM") as TIssuePriority;
  }

  private ensureType(value: unknown): TIssueType {
    const allowed: TIssueType[] = ["STORY", "TASK", "BUG", "EPIC"];
    const normalized = String(value ?? "TASK").toUpperCase();
    return (allowed.includes(normalized as TIssueType) ? normalized : "TASK") as TIssueType;
  }
}
