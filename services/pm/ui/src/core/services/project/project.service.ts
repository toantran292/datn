import { API_BASE_URL } from "@unified-teamspace/constants";
import { TProject } from "@unified-teamspace/types";
import { APIService } from "@/core/services/api.service";

export class ProjectService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createProject(workspaceSlug: string, data: Partial<TProject>): Promise<TProject> {
    return this.post(`/api/projects`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
