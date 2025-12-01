import { APIService } from "../api.service";

export interface IOrgMemberInfo {
  id: string;
  email: string;
  display_name: string;
  role: string;
  status: string;
  avatar_url: string | null;
  joined_at: string;
  roles: string[];
  member_type: string;
  project_roles: { project_id: string; project_name: string; role: string }[];
}

export interface IPagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export class IdentityService extends APIService {
  private identityBaseUrl: string;

  constructor() {
    super();
    this.identityBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/pm").replace(/\/pm$/, "");
  }

  async getOrgMembers(orgId: string, page = 0, size = 200): Promise<IPagedResponse<IOrgMemberInfo>> {
    const url = `${this.identityBaseUrl}/orgs/${orgId}/members`;

    return this.get(url, { params: { page, size } })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }
}
