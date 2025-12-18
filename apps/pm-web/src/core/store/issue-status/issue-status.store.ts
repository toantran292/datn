import update from "lodash/update";
import { observable, action, makeObservable, runInAction } from "mobx";
import { TLoader } from "@uts/types";
import { IIssueStatus, TIssueStatusMap, TProjectIssueStatusIdsMap, ICreateIssueStatusPayload, IUpdateIssueStatusPayload } from "@/core/types/issue-status";
import { IssueStatusService } from "@/core/services/issue-status";
import { CoreRootStore } from "../root.store";

export interface IIssueStatusStore {
  // observables
  issueStatusMap: TIssueStatusMap;
  projectIssueStatusIdsMap: TProjectIssueStatusIdsMap;
  projectFetchStatus: Record<string, "init-loader" | "fetching" | "complete" | undefined>;

  // actions
  fetchIssueStatusesByProject: (projectId: string) => Promise<IIssueStatus[]>;
  createIssueStatus: (projectId: string, data: ICreateIssueStatusPayload) => Promise<IIssueStatus>;
  updateIssueStatus: (statusId: string, data: IUpdateIssueStatusPayload) => Promise<IIssueStatus>;
  deleteIssueStatus: (statusId: string) => Promise<void>;
  reorderIssueStatuses: (projectId: string, statusIds: string[]) => Promise<IIssueStatus[]>;

  // getters
  getIssueStatusesForProject: (projectId: string) => IIssueStatus[];
  getIssueStatusById: (statusId: string) => IIssueStatus | undefined;
  getLoaderForProject: (projectId: string) => TLoader;
}

export class IssueStatusStore implements IIssueStatusStore {
  // observables
  issueStatusMap: TIssueStatusMap = {};
  projectIssueStatusIdsMap: TProjectIssueStatusIdsMap = {};
  projectFetchStatus: Record<string, "init-loader" | "fetching" | "complete" | undefined> = {};

  // root store
  rootStore: CoreRootStore;
  // service
  issueStatusService: IssueStatusService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      issueStatusMap: observable,
      projectIssueStatusIdsMap: observable,
      projectFetchStatus: observable,
      // actions
      fetchIssueStatusesByProject: action,
      createIssueStatus: action,
      updateIssueStatus: action,
      deleteIssueStatus: action,
      reorderIssueStatuses: action,
    });
    this.rootStore = _rootStore;
    this.issueStatusService = new IssueStatusService();
  }

  /**
   * Fetch issue statuses for a project
   */
  fetchIssueStatusesByProject = async (projectId: string) => {
    try {
      runInAction(() => {
        this.projectFetchStatus[projectId] = this.projectFetchStatus[projectId] === undefined ? "init-loader" : "fetching";
      });

      const statuses = await this.issueStatusService.getIssueStatusesByProject(projectId);

      runInAction(() => {
        statuses.forEach((status) => {
          update(this.issueStatusMap, [status.id], () => status);
        });

        // Sort by order and store IDs
        const sortedStatuses = statuses.sort((a, b) => a.order - b.order);
        update(this.projectIssueStatusIdsMap, [projectId], () => sortedStatuses.map((s) => s.id));

        this.projectFetchStatus[projectId] = "complete";
      });

      return statuses;
    } catch (error) {
      runInAction(() => {
        this.projectFetchStatus[projectId] = "complete";
      });
      console.error("Failed to fetch issue statuses:", error);
      throw error;
    }
  };

  /**
   * Create a new issue status
   */
  createIssueStatus = async (projectId: string, data: ICreateIssueStatusPayload) => {
    try {
      const status = await this.issueStatusService.createIssueStatus(projectId, data);

      runInAction(() => {
        update(this.issueStatusMap, [status.id], () => status);
        const existingIds = this.projectIssueStatusIdsMap[projectId] ?? [];
        update(this.projectIssueStatusIdsMap, [projectId], () => [...existingIds, status.id]);
      });

      return status;
    } catch (error) {
      console.error("Failed to create issue status:", error);
      throw error;
    }
  };

  /**
   * Update an issue status
   */
  updateIssueStatus = async (statusId: string, data: IUpdateIssueStatusPayload) => {
    try {
      const status = await this.issueStatusService.updateIssueStatus(statusId, data);

      runInAction(() => {
        update(this.issueStatusMap, [status.id], () => status);
      });

      return status;
    } catch (error) {
      console.error("Failed to update issue status:", error);
      throw error;
    }
  };

  /**
   * Delete an issue status
   */
  deleteIssueStatus = async (statusId: string) => {
    try {
      await this.issueStatusService.deleteIssueStatus(statusId);

      const status = this.issueStatusMap[statusId];
      if (status) {
        runInAction(() => {
          delete this.issueStatusMap[statusId];
          const projectId = status.projectId;
          const existingIds = this.projectIssueStatusIdsMap[projectId] ?? [];
          update(this.projectIssueStatusIdsMap, [projectId], () => existingIds.filter((id) => id !== statusId));
        });
      }
    } catch (error) {
      console.error("Failed to delete issue status:", error);
      throw error;
    }
  };

  /**
   * Reorder issue statuses
   */
  reorderIssueStatuses = async (projectId: string, statusIds: string[]) => {
    try {
      const statuses = await this.issueStatusService.reorderIssueStatuses(projectId, statusIds);

      runInAction(() => {
        statuses.forEach((status) => {
          update(this.issueStatusMap, [status.id], () => status);
        });
        update(this.projectIssueStatusIdsMap, [projectId], () => statusIds);
      });

      return statuses;
    } catch (error) {
      console.error("Failed to reorder issue statuses:", error);
      throw error;
    }
  };

  /**
   * Get all issue statuses for a project (sorted by order)
   */
  getIssueStatusesForProject = (projectId: string): IIssueStatus[] => {
    const statusIds = this.projectIssueStatusIdsMap[projectId] ?? [];
    return statusIds
      .map((id) => this.issueStatusMap[id])
      .filter((status): status is IIssueStatus => status !== undefined)
      .sort((a, b) => a.order - b.order);
  };

  /**
   * Get a single issue status by ID
   */
  getIssueStatusById = (statusId: string): IIssueStatus | undefined => this.issueStatusMap[statusId];

  /**
   * Get loader state for a project
   */
  getLoaderForProject = (projectId: string): TLoader => {
    const status = this.projectFetchStatus[projectId];
    if (status === undefined || status === "init-loader") return "init-loader";
    if (status === "fetching") return "mutation-loader";
    return "loaded";
  };
}
