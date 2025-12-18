import { TPartialProject, TProject } from "@uts/types";
import { APIService } from "@/core/services/api.service";

type TProjectLiteResponse = {
  id: string;
  identifier: string;
  name: string;
  orgId: string;
  projectLead: string | null;
};

type TProjectDetailResponse = TProjectLiteResponse & {
  defaultAssignee: string | null;
  createdAt: string;
  updatedAt: string;
  sprintIds: string[];
};

export class ProjectService extends APIService {
  constructor() {
    super();
  }

  async getProjectsLite(): Promise<TPartialProject[]> {
    return this.get(`/api/projects`)
      .then((response) => {
        const projects: TProjectLiteResponse[] = response?.data ?? [];

        return projects.map((project) => ({
          id: project.id,
          name: project.name,
          identifier: project.identifier,
          sort_order: null,
          logo_props: {
            in_use: "icon",
            icon: {
              name: "folder",
              color: "#6B7280",
              background_color: "#F3F4F6",
            },
          },
          archived_at: null,
          workspace: project.orgId,
          cycle_view: false,
          issue_views_view: false,
          module_view: false,
          page_view: false,
          inbox_view: false,
          guest_view_all_features: false,
          project_lead: project.projectLead,
        })) as TPartialProject[];
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createProject(workspaceSlug: string, data: Partial<TProject>): Promise<TProject> {
    return this.post(`/api/projects`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getProjectById(projectId: string): Promise<TProjectDetailResponse> {
    return this.get(`/api/projects/${projectId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  async updateProject(projectId: string, data: Partial<TProject>): Promise<TProjectDetailResponse> {
    return this.put(`/api/projects/${projectId}`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  async deleteProject(projectId: string): Promise<void> {
    return this.delete(`/api/projects/${projectId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }
}
