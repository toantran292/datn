import type {
  GetSprintRisksResponse,
  DetectRisksResponse,
  AcknowledgeRiskRequest,
  AcknowledgeRiskResponse,
  ResolveRiskRequest,
  ResolveRiskResponse,
  DismissRiskRequest,
  DismissRiskResponse,
  ApplyRecommendationRequest,
  ApplyRecommendationResponse,
  GetSprintHealthResponse,
  GetSprintHealthHistoryResponse,
} from "@/core/types/risk-detector";
import { APIService } from "./api.service";

export class RiskDetectorService extends APIService {
  constructor() {
    super();
  }

  /**
   * Get all risks for a sprint with optional filtering
   */
  async getSprintRisks(
    sprintId: string,
    params?: {
      status?: string;
      severity?: string;
      riskType?: string;
    }
  ): Promise<GetSprintRisksResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      if (params?.severity) queryParams.append("severity", params.severity);
      if (params?.riskType) queryParams.append("riskType", params.riskType);

      const queryString = queryParams.toString();
      const url = `/api/risk-detector/sprints/${sprintId}/risks${queryString ? `?${queryString}` : ""}`;

      const response = await this.get(url);
      return response?.data as GetSprintRisksResponse;
    } catch (error: any) {
      console.error("Get sprint risks error:", error);
      return this.handleError(error);
    }
  }

  /**
   * Trigger risk detection for a sprint
   */
  async detectSprintRisks(sprintId: string): Promise<DetectRisksResponse> {
    try {
      const response = await this.post(
        `/api/risk-detector/sprints/${sprintId}/risks/detect`
      );
      return response?.data as DetectRisksResponse;
    } catch (error: any) {
      console.error("Detect sprint risks error:", error);
      return this.handleError(error);
    }
  }

  /**
   * Acknowledge a risk alert
   */
  async acknowledgeRisk(
    riskId: string,
    request: AcknowledgeRiskRequest
  ): Promise<AcknowledgeRiskResponse> {
    try {
      const response = await this.put(
        `/api/risk-detector/risks/${riskId}/acknowledge`,
        request
      );
      return response?.data as AcknowledgeRiskResponse;
    } catch (error: any) {
      console.error("Acknowledge risk error:", error);
      return this.handleError(error);
    }
  }

  /**
   * Resolve a risk alert
   */
  async resolveRisk(
    riskId: string,
    request: ResolveRiskRequest
  ): Promise<ResolveRiskResponse> {
    try {
      const response = await this.put(
        `/api/risk-detector/risks/${riskId}/resolve`,
        request
      );
      return response?.data as ResolveRiskResponse;
    } catch (error: any) {
      console.error("Resolve risk error:", error);
      return this.handleError(error);
    }
  }

  /**
   * Dismiss a risk alert
   */
  async dismissRisk(
    riskId: string,
    request: DismissRiskRequest
  ): Promise<DismissRiskResponse> {
    try {
      const response = await this.delete(
        `/api/risk-detector/risks/${riskId}/dismiss`,
        request
      );
      return response?.data as DismissRiskResponse;
    } catch (error: any) {
      console.error("Dismiss risk error:", error);
      return this.handleError(error);
    }
  }

  /**
   * Apply a recommendation (auto-execute suggested actions)
   */
  async applyRecommendation(
    recommendationId: string,
    request: ApplyRecommendationRequest = {}
  ): Promise<ApplyRecommendationResponse> {
    try {
      const response = await this.put(
        `/api/risk-detector/recommendations/${recommendationId}/apply`,
        request
      );
      return response?.data as ApplyRecommendationResponse;
    } catch (error: any) {
      console.error("Apply recommendation error:", error);
      return this.handleError(error);
    }
  }

  /**
   * Get sprint health score and metrics
   */
  async getSprintHealth(sprintId: string): Promise<GetSprintHealthResponse> {
    try {
      const response = await this.get(
        `/api/risk-detector/sprints/${sprintId}/health`
      );
      return response?.data as GetSprintHealthResponse;
    } catch (error: any) {
      console.error("Get sprint health error:", error);
      return this.handleError(error);
    }
  }

  /**
   * Get sprint health history
   */
  async getSprintHealthHistory(
    sprintId: string,
    params?: {
      days?: number;
      limit?: number;
    }
  ): Promise<GetSprintHealthHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.days) queryParams.append("days", params.days.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const queryString = queryParams.toString();
      const url = `/api/risk-detector/sprints/${sprintId}/health/history${queryString ? `?${queryString}` : ""}`;

      const response = await this.get(url);
      return response?.data as GetSprintHealthHistoryResponse;
    } catch (error: any) {
      console.error("Get sprint health history error:", error);
      return this.handleError(error);
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: any): any {
    const status = error?.response?.status;

    if (status === 429) {
      return {
        success: false,
        error: {
          code: "RATE_LIMIT",
          message: "Đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau.",
        },
      };
    }

    if (status === 400) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            error?.response?.data?.message ||
            "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
        },
      };
    }

    if (status === 404) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Không tìm thấy dữ liệu.",
        },
      };
    }

    if (status >= 500) {
      return {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Lỗi server. Vui lòng thử lại sau.",
        },
      };
    }

    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Không thể kết nối đến Risk Detector service. Vui lòng thử lại.",
      },
    };
  }
}

// Export singleton instance
export const riskDetectorService = new RiskDetectorService();
