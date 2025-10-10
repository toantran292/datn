import { action, makeObservable, observable, runInAction } from "mobx";

import { TFetchStatus, TLoader } from "@uts/types";

import { IssueService } from "@/core/services/issue";
import { CoreRootStore } from "@/core/store/root.store";
import {
  ICreateIssuePayload,
  IIssue,
  IReorderIssuePayload,
  TIssueMap,
  TProjectIssueIdsMap,
} from "@/core/types/issue";

export interface IIssueStore {
  projectLoaders: Record<string, TLoader>;
  projectFetchStatus: Record<string, TFetchStatus>;
  issueMap: TIssueMap;
  projectIssueIdsMap: TProjectIssueIdsMap;

  fetchIssuesByProject: (projectId: string) => Promise<IIssue[]>;
  createIssue: (payload: ICreateIssuePayload) => Promise<IIssue>;
  reorderIssue: (projectId: string, payload: IReorderIssuePayload) => Promise<void>;
  updateIssue: (issueId: string, data: Partial<IIssue>) => Promise<IIssue>;
  getIssueById: (issueId: string) => IIssue | undefined;
  getIssuesForProject: (projectId: string) => IIssue[];
  getLoaderForProject: (projectId: string) => TLoader;
}

interface ISectionIssueMap {
  order: (string | null)[];
  map: Map<string | null, string[]>;
}

const BACKLOG_SECTION_ID: string | null = null;

export class IssueStore implements IIssueStore {
  projectLoaders: Record<string, TLoader> = {};
  projectFetchStatus: Record<string, TFetchStatus> = {};
  issueMap: TIssueMap = {};
  projectIssueIdsMap: TProjectIssueIdsMap = {};

  private readonly _rootStore: CoreRootStore;
  private issueService: IssueService;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      projectLoaders: observable.ref,
      projectFetchStatus: observable.ref,
      issueMap: observable.ref,
      projectIssueIdsMap: observable.ref,
      fetchIssuesByProject: action,
      createIssue: action,
      reorderIssue: action,
      updateIssue: action,
    });

    this._rootStore = rootStore;
    this.issueService = new IssueService();
  }

  fetchIssuesByProject = async (projectId: string) => {
    this.projectLoaders = { ...this.projectLoaders, [projectId]: "init-loader" };

    try {
      const issues = await this.issueService.getIssuesByProject(projectId);

      runInAction(() => {
        const updatedIssueMap = { ...this.issueMap };
        issues.forEach((issue) => {
          updatedIssueMap[issue.id] = issue;
        });
        this.issueMap = updatedIssueMap;
        this.projectIssueIdsMap = { ...this.projectIssueIdsMap, [projectId]: issues.map((issue) => issue.id) };
        this.projectLoaders = { ...this.projectLoaders, [projectId]: "loaded" };
        this.projectFetchStatus = { ...this.projectFetchStatus, [projectId]: "complete" };
      });

      return issues;
    } catch (error) {
      runInAction(() => {
        this.projectLoaders = { ...this.projectLoaders, [projectId]: "loaded" };
      });
      throw error;
    }
  };

  updateIssue = async (issueId: string, data: Partial<IIssue>) => {
    const existing = this.issueMap[issueId];
    if (!existing) throw new Error("Issue không tồn tại");

    const optimistic: IIssue = {
      ...existing,
      ...data,
    };

    runInAction(() => {
      this.issueMap = { ...this.issueMap, [issueId]: optimistic };
    });

    try {
      const saved = await this.issueService.updateIssue({ ...optimistic });
      runInAction(() => {
        this.issueMap = { ...this.issueMap, [issueId]: saved };
      });
      return saved;
    } catch (error) {
      runInAction(() => {
        this.issueMap = { ...this.issueMap, [issueId]: existing };
      });
      throw error;
    }
  };

  createIssue = async (payload: ICreateIssuePayload) => {
    const projectId = payload.projectId;
    this.projectLoaders = { ...this.projectLoaders, [projectId]: "mutation" };

    try {
      const issue = await this.issueService.createIssue(payload);

      runInAction(() => {
        this.issueMap = { ...this.issueMap, [issue.id]: issue };

        const existingIssueIds = this.projectIssueIdsMap[projectId] ?? [];
        this.projectIssueIdsMap = {
          ...this.projectIssueIdsMap,
          [projectId]: existingIssueIds.includes(issue.id) ? existingIssueIds : [issue.id, ...existingIssueIds],
        };

        this.projectLoaders = { ...this.projectLoaders, [projectId]: "loaded" };
        this.projectFetchStatus = { ...this.projectFetchStatus, [projectId]: "complete" };
      });

      if (issue.sprintId) {
        this._rootStore.projectRoot.sprint.appendIssueToSprint(issue.sprintId, issue.id);
      }

      return issue;
    } catch (error) {
      runInAction(() => {
        this.projectLoaders = { ...this.projectLoaders, [projectId]: "loaded" };
      });
      throw error;
    }
  };

  reorderIssue = async (projectId: string, payload: IReorderIssuePayload) => {
    const projectIssueIds = this.projectIssueIdsMap[projectId];
    if (!projectIssueIds) return;

    if (
      payload.destinationIssueId === payload.issueId &&
      payload.fromSectionId === payload.toSectionId &&
      payload.position !== "end"
    ) {
      return;
    }

    const sectionIssueData = this.buildSectionIssueMap(projectIssueIds);
    const fromSectionId = this.issueMap[payload.issueId]?.sprintId ?? BACKLOG_SECTION_ID;
    const toSectionId = payload.toSectionId ?? BACKLOG_SECTION_ID;

    this.removeIssueFromSection(sectionIssueData.map, fromSectionId, payload.issueId);
    this.ensureSectionExists(sectionIssueData, toSectionId);

    const destinationList = sectionIssueData.map.get(toSectionId) ?? [];

    let insertIndex = destinationList.length;
    if (payload.destinationIssueId) {
      const destIndex = destinationList.indexOf(payload.destinationIssueId);
      insertIndex = destIndex === -1 ? destinationList.length : destIndex + (payload.position === "after" ? 1 : 0);
    } else if (payload.position === "before") {
      insertIndex = 0;
    }

    destinationList.splice(insertIndex, 0, payload.issueId);
    sectionIssueData.map.set(toSectionId, destinationList);

    if (!sectionIssueData.order.includes(BACKLOG_SECTION_ID)) {
      sectionIssueData.order.unshift(BACKLOG_SECTION_ID);
    }

    const uniqueSectionOrder = Array.from(new Set(sectionIssueData.order));
    const newProjectIssueIds: string[] = [];

    uniqueSectionOrder.forEach((sectionId) => {
      const list = sectionIssueData.map.get(sectionId);
      if (!list) return;
      newProjectIssueIds.push(...list);
    });

    const updatedIssueMap: TIssueMap = { ...this.issueMap };
    uniqueSectionOrder.forEach((sectionId) => {
      const list = sectionIssueData.map.get(sectionId) ?? [];
      list.forEach((issueId, index) => {
        const existingIssue = updatedIssueMap[issueId];
        if (!existingIssue) return;
        updatedIssueMap[issueId] = {
          ...existingIssue,
          sprintId: sectionId,
          sortOrder: newProjectIssueIds.indexOf(issueId),
        };
      });
    });

    runInAction(() => {
      this.issueMap = updatedIssueMap;
      this.projectIssueIdsMap = { ...this.projectIssueIdsMap, [projectId]: newProjectIssueIds };
    });

    uniqueSectionOrder.forEach((sectionId) => {
      if (sectionId) {
        const issueIds = sectionIssueData.map.get(sectionId) ?? [];
        this._rootStore.projectRoot.sprint.setIssueIdsForSprint(sectionId, issueIds);
      }
    });

    try {
      await this.issueService.reorderIssue(projectId, payload.issueId, payload);
    } catch (error) {
      await this.fetchIssuesByProject(projectId);
      throw error;
    }
  };

  getIssueById = (issueId: string) => this.issueMap[issueId];

  getIssuesForProject = (projectId: string) => {
    const issueIds = this.projectIssueIdsMap[projectId] ?? [];
    return issueIds.map((id) => this.issueMap[id]).filter(Boolean) as IIssue[];
  };

  getLoaderForProject = (projectId: string) => this.projectLoaders[projectId];

  private buildSectionIssueMap(projectIssueIds: string[]): ISectionIssueMap {
    const map = new Map<string | null, string[]>();
    const order: (string | null)[] = [];

    projectIssueIds.forEach((issueId) => {
      const sectionId = this.issueMap[issueId]?.sprintId ?? BACKLOG_SECTION_ID;
      if (!map.has(sectionId)) {
        map.set(sectionId, []);
        order.push(sectionId);
      }
      map.get(sectionId)!.push(issueId);
    });

    if (!order.includes(BACKLOG_SECTION_ID)) {
      order.unshift(BACKLOG_SECTION_ID);
    }

    return { order, map };
  }

  private removeIssueFromSection(
    map: Map<string | null, string[]>,
    sectionId: string | null,
    issueId: string
  ) {
    const list = map.get(sectionId);
    if (!list) return;
    const index = list.indexOf(issueId);
    if (index !== -1) list.splice(index, 1);
    map.set(sectionId, list);
  }

  private ensureSectionExists(sectionData: ISectionIssueMap, sectionId: string | null) {
    if (sectionData.map.has(sectionId)) return;
    sectionData.map.set(sectionId, []);
    sectionData.order.push(sectionId);
  }
}
