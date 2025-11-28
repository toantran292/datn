import { APIService } from "@/core/services/api.service";
import { IIssueStatus, ICreateIssueStatusPayload, IUpdateIssueStatusPayload } from "@/core/types/issue-status";

export class IssueStatusService extends APIService {
  constructor() {
    super();
  }

  async getIssueStatusesByProject(projectId: string): Promise<IIssueStatus[]> {
    return this.get(`/api/issue-statuses`, { params: { projectId } })
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueStatus(projectId: string, data: ICreateIssueStatusPayload): Promise<IIssueStatus> {
    return this.post(`/api/issue-statuses`, { ...data, projectId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateIssueStatus(statusId: string, data: IUpdateIssueStatusPayload): Promise<IIssueStatus> {
    return this.put(`/api/issue-statuses/${statusId}`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueStatus(statusId: string): Promise<void> {
    return this.delete(`/api/issue-statuses/${statusId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async reorderIssueStatuses(projectId: string, statusIds: string[]): Promise<IIssueStatus[]> {
    return this.patch(`/api/issue-statuses/reorder`, { projectId, statusIds })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

