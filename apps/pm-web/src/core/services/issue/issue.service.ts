import { ICreateIssuePayload, IIssue, IReorderIssuePayload, TIssuePriority, TIssueState, TIssueType } from "@/core/types/issue";

import { APIService } from "../api.service";

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

  async getProjectAnalytics(projectId: string): Promise<{ counts: any; timeline: any[] }> {
    return this.get(`/api/projects/${projectId}/analytics`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  async getIssueById(issueId: string): Promise<IIssue> {
    return this.get(`/api/issues/${issueId}`)
      .then((response) => this.normalizeIssue(response?.data))
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  async createIssue(payload: ICreateIssuePayload): Promise<IIssue> {
    const body: any = {
      projectId: payload.projectId,
      sprintId: payload.sprintId ?? null,
      parentId: payload.parentId ?? null,
      name: payload.name,
      description: payload.description ?? null,
      descriptionHtml: payload.descriptionHtml ?? null,
      priority: payload.priority,
      type: payload.type,
      point: payload.point ?? null,
      sortOrder: payload.sortOrder ?? null,
      startDate: payload.startDate ?? null,
      targetDate: payload.targetDate ?? null,
      assignees: payload.assignees ?? [],
    };

    // Only include statusId if provided
    if ((payload as any).statusId) {
      body.statusId = (payload as any).statusId;
    }

    return this.post(`/api/issues`, body)
      .then((response) => this.normalizeIssue(response?.data))
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  async updateIssue(issue: IIssue | Partial<IIssue> & { id: string }): Promise<IIssue> {
    const body: any = {
      statusId: (issue as IIssue).statusId,
    };

    // Only include fields that are present
    if ('projectId' in issue) body.projectId = issue.projectId;
    if ('sprintId' in issue) body.sprintId = issue.sprintId ?? null;
    if ('parentId' in issue) body.parentId = issue.parentId ?? null;
    if ('name' in issue) body.name = issue.name;
    if ('description' in issue) body.description = issue.description ?? null;
    if ('descriptionHtml' in issue) body.descriptionHtml = issue.descriptionHtml ?? null;
    if ('state' in issue) body.state = issue.state;
    if ('priority' in issue) body.priority = issue.priority;
    if ('type' in issue) body.type = issue.type;
    if ('point' in issue) body.point = issue.point ?? null;
    if ('sortOrder' in issue) body.sortOrder = issue.sortOrder ?? null;
    if ('startDate' in issue) body.startDate = issue.startDate ?? null;
    if ('targetDate' in issue) body.targetDate = issue.targetDate ?? null;
    if ('assignees' in issue) body.assignees = issue.assignees ?? [];

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

  async deleteIssue(issueId: string): Promise<void> {
    return this.delete(`/api/issues/${issueId}`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  private normalizeIssue(rawIssue: unknown): IIssue {
    const issue = rawIssue as Record<string, unknown>;

    return {
      id: String(issue.id ?? ""),
      projectId: String(issue.projectId ?? ""),
      sprintId: issue.sprintId ? String(issue.sprintId) : null,
      parentId: issue.parentId ? String(issue.parentId) : null,
      statusId: String(issue.statusId ?? ""),
      name: String(issue.name ?? ""),
      description: (issue.description as string | null | undefined) ?? null,
      descriptionHtml: (issue.descriptionHtml as string | null | undefined) ?? null,
      state: this.ensureState(issue.state),
      priority: this.ensurePriority(issue.priority),
      type: this.ensureType(issue.type),
      point: issue.point === null || issue.point === undefined ? null : Number(issue.point),
      sequenceId: Number(issue.sequenceId),
      sortOrder: issue.sortOrder === null || issue.sortOrder === undefined ? null : Number(issue.sortOrder),
      startDate: (issue.startDate as string | null | undefined) ?? null,
      targetDate: (issue.targetDate as string | null | undefined) ?? null,
      assignees: Array.isArray(issue.assignees)
        ? (issue.assignees as unknown[]).map((assignee) => String(assignee))
        : [],
      createdBy: String(issue.createdBy ?? ""),
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
