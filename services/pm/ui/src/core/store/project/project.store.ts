import { TFetchStatus, TLoader, TPartialProject, TProject } from "@uts/types";
import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { ProjectService } from "@/core/services/project";
import { CoreRootStore } from "../root.store";
import update from "lodash/update";

export interface IProjectStore {
  // observables
  loader: TLoader;
  fetchStatus: TFetchStatus;
  isCreating: boolean;

  projectMap: Record<string, TPartialProject>;
  projectIds: string[];

  // actions
  createProject: (workspaceSlug: string, data: Partial<TProject>) => Promise<TProject>;
  fetchPartialProjects: (_workspaceSlug?: string) => Promise<TPartialProject[]>;

  // getters
  getPartialProjectById: (projectId: string) => TPartialProject | undefined;
  readonly joinedProjectIds: string[];
}

export class ProjectStore implements IProjectStore {
  // observables
  loader: TLoader = "init-loader";
  isCreating: boolean = false;
  fetchStatus: TFetchStatus = undefined;
  projectMap: Record<string, TPartialProject> = {};
  projectIds: string[] = [];
  // root store
  rootStore: CoreRootStore;
  // service
  projectService: ProjectService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      projectMap: observable,
      isCreating: observable,
      fetchStatus: observable.ref,
      projectIds: observable.ref,
      // actions
      createProject: action,
      fetchPartialProjects: action,
      // computed
      joinedProjectIds: computed,
    });
    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
  }

  /**
   * @description returns true if projects are still initializing
   */
  get isInitializingProjects() {
    return this.loader === "init-loader";
  }

  /**
   * Fetch lightweight project data used during initialization flows
   */
  fetchPartialProjects = async (_workspaceSlug?: string) => {
    try {
      this.loader = "init-loader";
      const projectsResponse = await this.projectService.getProjectsLite();
      runInAction(() => {
        projectsResponse.forEach((project) => {
          update(this.projectMap, [project.id], (p) => ({ ...p, ...project }));
        });
        const sortedProjects = Object.values(this.projectMap).sort((a, b) => {
          const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });
        this.projectIds = sortedProjects.map((project) => project.id);
        this.loader = "loaded";
        this.fetchStatus = "partial";
      });
      return projectsResponse;
    } catch (error) {
      console.log("Failed to fetch project from workspace store");
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Create new project
   */
  createProject = async (workspaceSlug: string, data: Partial<TProject>) => {
    try {
      runInAction(() => {
        this.isCreating = true;
      });

      const project = await this.projectService.createProject(workspaceSlug, data);

      runInAction(() => {
        this.isCreating = false;
        update(this.projectMap, [project.id], () => ({ ...project } as TPartialProject));
        const sortedProjects = Object.values(this.projectMap).sort((a, b) => {
          const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });
        this.projectIds = sortedProjects.map((p) => p.id);
      });

      return project;
    } catch (error) {
      runInAction(() => {
        this.isCreating = false;
      });

      console.error("Failed to create project:", error);
      throw error;
    }
  };

  get joinedProjectIds() {
    return this.projectIds;
  }

  getPartialProjectById = (projectId: string) => this.projectMap[projectId];
}
