import { action, makeObservable, observable, runInAction } from "mobx";

import { TFetchStatus, TLoader } from "@unified-teamspace/types";

import { SprintService } from "@/core/services/sprint";
import { CoreRootStore } from "@/core/store/root.store";
import { ICreateSprintPayload, IUpdateSprintPayload, ISprint, TSprintMap, TProjectSprintIdsMap } from "@/core/types/sprint";

export interface ISprintStore {
  projectLoaders: Record<string, TLoader>;
  projectFetchStatus: Record<string, TFetchStatus>;
  sprintMap: TSprintMap;
  projectSprintIdsMap: TProjectSprintIdsMap;

  fetchSprintsByProject: (projectId: string) => Promise<ISprint[]>;
  createSprint: (payload: ICreateSprintPayload) => Promise<ISprint>;
  updateSprint: (sprintId: string, payload: IUpdateSprintPayload) => Promise<ISprint>;
  getSprintById: (sprintId: string) => ISprint | undefined;
  getSprintsForProject: (projectId: string) => ISprint[];
  getLoaderForProject: (projectId: string) => TLoader;
  appendIssueToSprint: (sprintId: string, issueId: string) => void;
  setIssueIdsForSprint: (sprintId: string, issueIds: string[]) => void;
}

export class SprintStore implements ISprintStore {
  projectLoaders: Record<string, TLoader> = {};
  projectFetchStatus: Record<string, TFetchStatus> = {};
  sprintMap: TSprintMap = {};
  projectSprintIdsMap: TProjectSprintIdsMap = {};

  private readonly _rootStore: CoreRootStore;
  private readonly sprintService: SprintService;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      projectLoaders: observable.ref,
      projectFetchStatus: observable.ref,
      sprintMap: observable.ref,
      projectSprintIdsMap: observable.ref,
      fetchSprintsByProject: action,
      createSprint: action,
      updateSprint: action,
      appendIssueToSprint: action,
      setIssueIdsForSprint: action,
    });

    this._rootStore = rootStore;
    this.sprintService = new SprintService();
  }

  fetchSprintsByProject = async (projectId: string) => {
    this.projectLoaders = { ...this.projectLoaders, [projectId]: "init-loader" };

    try {
      const sprints = await this.sprintService.getSprintsByProject(projectId);

      runInAction(() => {
        const updatedSprintMap = { ...this.sprintMap };
        sprints.forEach((sprint) => {
          updatedSprintMap[sprint.id] = sprint;
        });
        this.sprintMap = updatedSprintMap;
        this.projectSprintIdsMap = { ...this.projectSprintIdsMap, [projectId]: sprints.map((sprint) => sprint.id) };
        this.projectLoaders = { ...this.projectLoaders, [projectId]: "loaded" };
        this.projectFetchStatus = { ...this.projectFetchStatus, [projectId]: "complete" };
      });

      return sprints;
    } catch (error) {
      runInAction(() => {
        this.projectLoaders = { ...this.projectLoaders, [projectId]: "loaded" };
      });
      throw error;
    }
  };

  createSprint = async (payload: ICreateSprintPayload) => {
    const projectId = payload.projectId;
    this.projectLoaders = { ...this.projectLoaders, [projectId]: "mutation" };

    try {
      const sprint = await this.sprintService.createSprint(payload);

      runInAction(() => {
        this.sprintMap = { ...this.sprintMap, [sprint.id]: sprint };

        const existingIds = this.projectSprintIdsMap[projectId] ?? [];
        this.projectSprintIdsMap = {
          ...this.projectSprintIdsMap,
          [projectId]: existingIds.includes(sprint.id) ? existingIds : [sprint.id, ...existingIds],
        };

        this.projectLoaders = { ...this.projectLoaders, [projectId]: "loaded" };
        this.projectFetchStatus = { ...this.projectFetchStatus, [projectId]: "complete" };
      });

      return sprint;
    } catch (error) {
      runInAction(() => {
        this.projectLoaders = { ...this.projectLoaders, [projectId]: "loaded" };
      });
      throw error;
    }
  };

  updateSprint = async (sprintId: string, payload: IUpdateSprintPayload) => {
    const projectId = payload.projectId;
    this.projectLoaders = { ...this.projectLoaders, [projectId]: "mutation" };

    try {
      const sprint = await this.sprintService.updateSprint(sprintId, payload);

      runInAction(() => {
        this.sprintMap = { ...this.sprintMap, [sprint.id]: sprint };
        const existingIds = this.projectSprintIdsMap[projectId] ?? [];
        if (!existingIds.includes(sprint.id)) {
          this.projectSprintIdsMap = {
            ...this.projectSprintIdsMap,
            [projectId]: [sprint.id, ...existingIds],
          };
        }
        this.projectLoaders = { ...this.projectLoaders, [projectId]: "loaded" };
        this.projectFetchStatus = { ...this.projectFetchStatus, [projectId]: "complete" };
      });

      return sprint;
    } catch (error) {
      runInAction(() => {
        this.projectLoaders = { ...this.projectLoaders, [projectId]: "loaded" };
      });
      throw error;
    }
  };

  getSprintById = (sprintId: string) => this.sprintMap[sprintId];

  getSprintsForProject = (projectId: string) => {
    const sprintIds = this.projectSprintIdsMap[projectId] ?? [];
    return sprintIds.map((id) => this.sprintMap[id]).filter(Boolean) as ISprint[];
  };

  getLoaderForProject = (projectId: string) => this.projectLoaders[projectId];

  appendIssueToSprint = (sprintId: string, issueId: string) => {
    const sprint = this.sprintMap[sprintId];
    if (!sprint) return;

    if (sprint.issueIds.includes(issueId)) return;

    const updatedSprint: ISprint = {
      ...sprint,
      issueIds: [issueId, ...sprint.issueIds],
    };

    this.sprintMap = { ...this.sprintMap, [sprintId]: updatedSprint };
  };

  setIssueIdsForSprint = (sprintId: string, issueIds: string[]) => {
    const sprint = this.sprintMap[sprintId];
    if (!sprint) return;

    const updatedSprint: ISprint = {
      ...sprint,
      issueIds,
    };

    this.sprintMap = { ...this.sprintMap, [sprintId]: updatedSprint };
  };
}
