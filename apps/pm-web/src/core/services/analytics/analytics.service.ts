import { APIService } from "../api.service";

export interface IChartDataPoint {
  key: string;
  count: number;
  label?: string;
}

export interface IChartResponse {
  data: IChartDataPoint[];
}

export interface IStatsResponse {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
}

export class AnalyticsService extends APIService {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");
  }

  async getCreatedVsResolvedChart(projectId: string, params?: Record<string, any>): Promise<IChartResponse> {
    return this.get(`/api/projects/${projectId}/analytics/charts/work-items`, { params })
      .then((res) => res.data)
      .catch((err) => {
        throw err?.response?.data || err;
      });
  }

  async getIssueStats(projectId: string): Promise<IStatsResponse> {
    return this.get(`/api/projects/${projectId}/analytics/stats`)
      .then((res) => res.data)
      .catch((err) => {
        throw err?.response?.data || err;
      });
  }
}

