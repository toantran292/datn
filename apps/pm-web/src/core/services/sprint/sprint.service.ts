import { ICreateSprintPayload, IUpdateSprintPayload, ISprint } from "@/core/types/sprint";

import { APIService } from "../api.service";

export class SprintService extends APIService {
  constructor() {
    super();
  }

  async getSprintsByProject(projectId: string): Promise<ISprint[]> {
    return this.get(`/api/projects/${projectId}/sprints`)
      .then((response) => {
        const sprints: unknown[] = response?.data ?? [];
        return sprints.map((sprint) => this.normalizeSprint(sprint));
      })
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  async createSprint(payload: ICreateSprintPayload): Promise<ISprint> {
    const body = {
      projectId: payload.projectId,
      name: payload.name,
      goal: payload.goal ?? null,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
    };

    return this.post(`/api/sprints`, body)
      .then((response) => this.normalizeSprint(response?.data))
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  async updateSprint(sprintId: string, payload: IUpdateSprintPayload): Promise<ISprint> {
    const body: Record<string, any> = {};

    if (payload.name !== undefined) body.name = payload.name;
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.goal !== undefined) body.goal = payload.goal;
    if (payload.startDate !== undefined) body.startDate = payload.startDate;
    if (payload.endDate !== undefined) body.endDate = payload.endDate;

    return this.patch(`/api/sprints/${sprintId}`, body)
      .then((response) => this.normalizeSprint(response?.data))
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  private normalizeSprint(rawSprint: unknown): ISprint {
    const sprint = rawSprint as Record<string, unknown>;

    return {
      id: String(sprint.id ?? ""),
      projectId: String(sprint.projectId ?? ""),
      name: String(sprint.name ?? ""),
      status: (sprint.status as "FUTURE" | "ACTIVE" | "CLOSED") ?? "FUTURE",
      goal: (sprint.goal as string | null | undefined) ?? null,
      startDate: (sprint.startDate as string | null | undefined) ?? null,
      endDate: (sprint.endDate as string | null | undefined) ?? null,
      createdAt: String(sprint.createdAt ?? ""),
      updatedAt: String(sprint.updatedAt ?? ""),
      issueIds: Array.isArray(sprint.issueIds)
        ? (sprint.issueIds as unknown[]).map((issueId) => String(issueId))
        : [],
    };
  }
}
