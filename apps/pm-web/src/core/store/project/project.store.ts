import update from "lodash/update";
import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { TFetchStatus, TLoader, TPartialProject, TProject } from "@uts/types";
import { ProjectService } from "@/core/services/project";
import { CoreRootStore } from "../root.store";

export interface IProjectStore {
  // observables
  loader: TLoader;
  fetchStatus: TFetchStatus;
  isCreating: boolean;

  projectMap: Record<string, TPartialProject>;
  projectIds: string[];
  currentProject: any | null;

  // actions
  createProject: (workspaceSlug: string, data: Partial<TProject>) => Promise<TProject>;
  fetchPartialProjects: (_workspaceSlug?: string) => Promise<TPartialProject[]>;
  fetchProjectDetails: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, data: Partial<TProject>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

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
  currentProject: any | null = null;
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
      currentProject: observable,
      // actions
      createProject: action,
      fetchPartialProjects: action,
      fetchProjectDetails: action,
      updateProject: action,
      deleteProject: action,
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
        // Ensure logo_props exists when updating projectMap
        const projectWithLogoProps = {
          ...project,
          logo_props: project.logo_props || {
            in_use: "icon",
            icon: {
              name: "folder",
              color: "#6B7280",
              background_color: "#F3F4F6",
            },
          },
        } as TPartialProject;

        update(this.projectMap, [project.id], () => projectWithLogoProps);
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

  /**
   * Fetch full project details
   */
  fetchProjectDetails = async (projectId: string) => {
    try {
      const projectDetails = await this.projectService.getProjectById(projectId);
      runInAction(() => {
        this.currentProject = projectDetails;
      });
    } catch (error) {
      console.error("Failed to fetch project details:", error);
      throw error;
    }
  };

  /**
   * Update project
   */
  updateProject = async (projectId: string, data: Partial<TProject>) => {
    try {
      const updatedProject = await this.projectService.updateProject(projectId, data);
      runInAction(() => {
        this.currentProject = updatedProject;
        // Also update in projectMap if exists
        if (this.projectMap[projectId]) {
          update(this.projectMap, [projectId], (p) => ({
            ...p,
            name: updatedProject.name,
            identifier: updatedProject.identifier,
            project_lead: updatedProject.projectLead,
          }));
        }
      });
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  };

  /**
   * Delete project
   */
  deleteProject = async (projectId: string) => {
    try {
      await this.projectService.deleteProject(projectId);
      runInAction(() => {
        // Remove from projectMap
        delete this.projectMap[projectId];
        // Remove from projectIds
        this.projectIds = this.projectIds.filter((id) => id !== projectId);
        // Clear currentProject if it was the deleted project
        if (this.currentProject?.id === projectId) {
          this.currentProject = null;
        }
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  };

  get joinedProjectIds() {
    return this.projectIds;
  }

  getPartialProjectById = (projectId: string) => this.projectMap[projectId];
}
