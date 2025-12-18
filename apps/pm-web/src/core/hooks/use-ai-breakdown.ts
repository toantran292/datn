import { useState, useCallback } from "react";
import { aiService } from "@/core/services/ai.service";
import type { BreakdownIssueRequest, BreakdownData } from "@/core/types/ai";

export interface UseAIBreakdownReturn {
  breakdown: (input: BreakdownIssueRequest) => Promise<BreakdownData | null>;
  isBreakingDown: boolean;
  error: string | null;
  reset: () => void;
  lastResult: BreakdownData | null;
}

/**
 * Hook for AI-powered issue breakdown
 * Breaks down Epics/Stories into structured sub-tasks
 */
export const useAIBreakdown = (): UseAIBreakdownReturn => {
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BreakdownData | null>(null);

  const breakdown = useCallback(
    async (input: BreakdownIssueRequest): Promise<BreakdownData | null> => {
      setIsBreakingDown(true);
      setError(null);

      try {
        const response = await aiService.breakdownIssue(input);

        if (response.success && response.data) {
          setLastResult(response.data);
          return response.data;
        } else {
          const errorMessage =
            response.error?.message ||
            "Không thể breakdown issue. Vui lòng thử lại.";
          setError(errorMessage);
          return null;
        }
      } catch (err) {
        const errorMessage = "Đã xảy ra lỗi khi breakdown. Vui lòng thử lại.";
        setError(errorMessage);
        return null;
      } finally {
        setIsBreakingDown(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setLastResult(null);
  }, []);

  return {
    breakdown,
    isBreakingDown,
    error,
    reset,
    lastResult,
  };
};
