import type {
  RefineDescriptionRequest,
  RefineDescriptionResponse,
  EstimatePointsRequest,
  EstimatePointsResponse,
} from "@/core/types/ai";
import { APIService } from "./api.service";

export class AIService extends APIService {
  constructor() {
    super();
  }

  /**
   * Refine issue description using AI
   */
  async refineDescription(
    request: RefineDescriptionRequest
  ): Promise<RefineDescriptionResponse> {
    try {
      const response = await this.post(`/api/ai/refine-description`, request);
      return response?.data as RefineDescriptionResponse;
    } catch (error: any) {
      console.error("AI refine description error:", error);

      // Handle specific HTTP status codes
      const status = error?.response?.status;

      if (status === 429) {
        return {
          success: false,
          error: {
            code: "RATE_LIMIT",
            message: "Đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau 1 giờ.",
          },
        };
      }

      if (status === 400) {
        return {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error?.response?.data?.message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
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

      // Handle network errors or other issues
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Không thể kết nối đến AI service. Vui lòng thử lại.",
        },
      };
    }
  }

  /**
   * Estimate story points for an issue using AI
   */
  async estimatePoints(
    request: EstimatePointsRequest
  ): Promise<EstimatePointsResponse> {
    try {
      const response = await this.post(`/api/ai/estimate-points`, request);
      return response?.data as EstimatePointsResponse;
    } catch (error: any) {
      console.error("AI estimate points error:", error);

      // Handle specific HTTP status codes
      const status = error?.response?.status;

      if (status === 429) {
        return {
          success: false,
          error: {
            code: "RATE_LIMIT",
            message: "Đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau 1 giờ.",
          },
        };
      }

      if (status === 400) {
        return {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error?.response?.data?.message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
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

      // Handle network errors or other issues
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Không thể kết nối đến AI service. Vui lòng thử lại.",
        },
      };
    }
  }

  /**
   * Check if AI service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get(`/api/health`);
      return response?.status === 200;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
