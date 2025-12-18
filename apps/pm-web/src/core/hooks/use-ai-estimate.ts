import { useState, useCallback } from "react";
import { aiService } from "@/core/services/ai.service";
import type {
  EstimatePointsRequest,
  EstimatePointsResponse,
  EstimatePointsData,
} from "@/core/types/ai";

interface UseAIEstimateReturn {
  estimate: (input: EstimatePointsRequest) => Promise<EstimatePointsData | null>;
  isEstimating: boolean;
  error: string | null;
  reset: () => void;
  lastResult: EstimatePointsData | null;
}

export const useAIEstimate = (): UseAIEstimateReturn => {
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<EstimatePointsData | null>(null);

  const estimate = useCallback(
    async (input: EstimatePointsRequest): Promise<EstimatePointsData | null> => {
      setIsEstimating(true);
      setError(null);

      try {
        const response: EstimatePointsResponse = await aiService.estimatePoints(input);

        if (response.success && response.data) {
          setLastResult(response.data);
          return response.data;
        } else {
          const errorMessage = response.error?.message || "Không thể estimate story points. Vui lòng thử lại.";
          setError(errorMessage);
          setLastResult(null);
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
        setError(errorMessage);
        setLastResult(null);
        return null;
      } finally {
        setIsEstimating(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setLastResult(null);
  }, []);

  return {
    estimate,
    isEstimating,
    error,
    reset,
    lastResult,
  };
};
