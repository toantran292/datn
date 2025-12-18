import { useState, useCallback } from "react";
import type {
  SprintSummaryRequest,
  SprintSummaryData,
  SprintOverview,
  SprintMetadata,
  PositiveHighlight,
  AreaOfConcern,
  Recommendation,
  Strength,
} from "@/core/types/ai-sprint-summary";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const useAISprintSummaryStream = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progressive state
  const [overview, setOverview] = useState<SprintOverview | null>(null);
  const [metadata, setMetadata] = useState<SprintMetadata | null>(null);
  const [positives, setPositives] = useState<PositiveHighlight[]>([]);
  const [concerns, setConcerns] = useState<AreaOfConcern[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [strengths, setStrengths] = useState<Strength[]>([]);
  const [closingMessage, setClosingMessage] = useState<string>("");
  const [progress, setProgress] = useState<string>("");

  const generateSummary = useCallback(
    async (request: SprintSummaryRequest): Promise<SprintSummaryData | null> => {
      setIsGenerating(true);
      setError(null);

      // Reset all state
      setOverview(null);
      setMetadata(null);
      setPositives([]);
      setConcerns([]);
      setRecommendations([]);
      setStrengths([]);
      setClosingMessage("");
      setProgress("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/ai/sprint-summary-stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Accumulators
        const accumulatedPositives: PositiveHighlight[] = [];
        const accumulatedConcerns: AreaOfConcern[] = [];
        const accumulatedRecommendations: Recommendation[] = [];
        const accumulatedStrengths: Strength[] = [];
        let finalOverview: SprintOverview | null = null;
        let finalMetadata: SprintMetadata | null = null;
        let finalClosingMessage = "";

        // Read stream chunks
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "progress") {
                  setProgress(data.message || "");
                } else if (data.type === "overview") {
                  finalOverview = data.value;
                  setOverview(data.value);
                } else if (data.type === "metadata") {
                  finalMetadata = data.value;
                  setMetadata(data.value);
                } else if (data.type === "positive") {
                  accumulatedPositives.push(data.value);
                  setPositives([...accumulatedPositives]);
                } else if (data.type === "concern") {
                  accumulatedConcerns.push(data.value);
                  setConcerns([...accumulatedConcerns]);
                } else if (data.type === "recommendation") {
                  accumulatedRecommendations.push(data.value);
                  setRecommendations([...accumulatedRecommendations]);
                } else if (data.type === "strength") {
                  accumulatedStrengths.push(data.value);
                  setStrengths([...accumulatedStrengths]);
                } else if (data.type === "closing") {
                  finalClosingMessage = data.value;
                  setClosingMessage(data.value);
                } else if (data.type === "complete") {
                  // Done!
                  setProgress("");
                } else if (data.type === "error") {
                  throw new Error(data.message || "Streaming failed");
                }
              } catch (parseError) {
                console.error("Failed to parse SSE data:", parseError);
              }
            }
          }
        }

        // Build final summary data
        if (!finalOverview || !finalMetadata) {
          throw new Error("Incomplete sprint summary data");
        }

        const summaryData: SprintSummaryData = {
          overview: finalOverview,
          metadata: finalMetadata,
          positives: accumulatedPositives,
          concerns: accumulatedConcerns,
          recommendations: accumulatedRecommendations,
          strengths: accumulatedStrengths,
          closingMessage: finalClosingMessage,
        };

        setIsGenerating(false);
        return summaryData;
      } catch (err) {
        console.error("Sprint summary streaming error:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setIsGenerating(false);
        return null;
      }
    },
    []
  );

  return {
    generateSummary,
    isGenerating,
    error,
    // Progressive state for real-time updates
    overview,
    metadata,
    positives,
    concerns,
    recommendations,
    strengths,
    closingMessage,
    progress,
  };
};
