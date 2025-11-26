// services
import type { IState } from "@uts/types";
import { APIService } from "@/core/services/api.service";

export class ProjectStateService extends APIService {
  constructor() {
    super();
  }

  async createState(workspaceSlug: string, projectId: string, data: any): Promise<IState> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
