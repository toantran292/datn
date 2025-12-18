import { useState, useCallback } from "react";
import { aiService } from "@/core/services/ai.service";
import type {
  RefineDescriptionRequest,
  RefineDescriptionResponse,
  RefineDescriptionData,
} from "@/core/types/ai";

interface UseAIRefineReturn {
  refine: (input: RefineDescriptionRequest) => Promise<RefineDescriptionData | null>;
  isRefining: boolean;
  error: string | null;
  reset: () => void;
  lastResult: RefineDescriptionData | null;
}

export const useAIRefine = (): UseAIRefineReturn => {
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RefineDescriptionData | null>(null);

  const refine = useCallback(
    async (input: RefineDescriptionRequest): Promise<RefineDescriptionData | null> => {
      setIsRefining(true);
      setError(null);

      try {
        const response: RefineDescriptionResponse = await aiService.refineDescription(input);

        if (response.success && response.data) {
          setLastResult(response.data);
          return response.data;
        } else {
          const errorMessage = response.error?.message || "Không thể refine description. Vui lòng thử lại.";
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
        setIsRefining(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setLastResult(null);
  }, []);

  return {
    refine,
    isRefining,
    error,
    reset,
    lastResult,
  };
};
