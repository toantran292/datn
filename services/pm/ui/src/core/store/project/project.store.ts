import { TProject } from "@unified-teamspace/types";
import { observable, action, makeObservable, runInAction } from "mobx";
import { ProjectService } from "@/core/services/project";
import { CoreRootStore } from "../root.store";

export interface IProjectStore {
  // observables
  isCreating: boolean;

  // actions
  createProject: (workspaceSlug: string, data: Partial<TProject>) => Promise<TProject>;
}

export class ProjectStore implements IProjectStore {
  // observables
  isCreating: boolean = false;

  // root store
  rootStore: CoreRootStore;
  // service
  projectService: ProjectService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      isCreating: observable,

      // actions
      createProject: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
  }

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

}
