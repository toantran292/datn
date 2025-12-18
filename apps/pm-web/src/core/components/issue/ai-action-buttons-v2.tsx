"use client";

import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";
import { useAIStream } from "@/core/hooks/use-ai-stream";
import { AIResponseCard } from "./ai-response-card";

interface AIActionButtonsV2Props {
  issueId?: string;
  onRefine?: (url: string, payload: any) => { url: string; payload: any };
  onEstimate?: (url: string, payload: any) => { url: string; payload: any };
  onBreakdown?: (url: string, payload: any) => { url: string; payload: any };
  disabled?: boolean;
}

type AIAction = "refine" | "estimate" | "breakdown" | null;

const LOADING_MESSAGES = [
  "✨ Generating...",
  "🧠 Thinking...",
  "🔮 Manifesting...",
  "🎨 Cooking...",
  "⚡ Processing...",
  "🚀 Creating magic...",
  "💫 Brewing ideas...",
  "🌟 Conjuring...",
];

interface AIResponse {
  action: AIAction;
  content: string;
  confidence: number;
}

export const AIActionButtonsV2: React.FC<AIActionButtonsV2Props> = ({
  issueId,
  onRefine,
  onEstimate,
  onBreakdown,
  disabled = false,
}) => {
  const [loadingAction, setLoadingAction] = useState<AIAction>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const { streamAI, isStreaming, streamedText, error } = useAIStream({
    onChunk: (chunk) => {
      // Real-time streaming feedback
      console.log("📝 Streaming chunk:", chunk);
    },
    onComplete: (fullText) => {
      console.log("✅ Streaming complete:", fullText);
    },
    onError: (error) => {
      console.error("❌ Streaming error:", error);
    },
  });

  // Cycle through loading messages
  useState(() => {
    const interval = setInterval(() => {
      if (loadingAction) {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }
    }, 1500);

    return () => clearInterval(interval);
  });

  const handleAction = useCallback(
    async (
      action: AIAction,
      configFn?: (url: string, payload: any) => { url: string; payload: any }
    ) => {
      if (!configFn || loadingAction) return;

      try {
        setLoadingAction(action);
        setLoadingMessageIndex(0);

        // Get API config from callback
        const { url, payload } = configFn(`/api/ai/${action}`, { issueId });

        // Stream AI response
        const result = await streamAI(url, payload);

        // Add to responses
        setResponses((prev) => [
          ...prev,
          {
            action,
            content: result.text,
            confidence: result.confidence || 95,
          },
        ]);

        setLoadingAction(null);
      } catch (error) {
        setLoadingAction(null);
        console.error(`AI ${action} error:`, error);
      }
    },
    [loadingAction, streamAI, issueId]
  );

  const handleRegenerate = useCallback(
    async (action: AIAction, index: number) => {
      const responseId = `${action}-${index}`;
      setRegeneratingId(responseId);

      try {
        // Get config based on action
        let configFn;
        switch (action) {
          case "refine":
            configFn = onRefine;
            break;
          case "estimate":
            configFn = onEstimate;
            break;
          case "breakdown":
            configFn = onBreakdown;
            break;
        }

        if (!configFn) return;

        const { url, payload } = configFn(`/api/ai/${action}`, { issueId });
        const result = await streamAI(url, payload);

        // Update response
        setResponses((prev) =>
          prev.map((r, i) =>
            i === index
              ? {
                  ...r,
                  content: result.text,
                  confidence: result.confidence || 95,
                }
              : r
          )
        );
      } finally {
        setRegeneratingId(null);
      }
    },
    [onRefine, onEstimate, onBreakdown, issueId, streamAI]
  );

  const isLoading = loadingAction !== null || isStreaming;

  const getActionTitle = (action: AIAction) => {
    switch (action) {
      case "refine":
        return "AI Refined Description";
      case "estimate":
        return "AI Story Points Estimate";
      case "breakdown":
        return "AI Task Breakdown";
      default:
        return "AI Response";
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* AI Refine Button */}
        <Button
          variant="neutral-primary"
          size="sm"
          className={cn(
            "gap-2 relative overflow-hidden transition-all duration-300",
            loadingAction === "refine" &&
              "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/50"
          )}
          disabled={disabled || isLoading}
          onClick={() => handleAction("refine", onRefine)}
        >
          {loadingAction === "refine" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 animate-shimmer" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </>
          )}
          <Sparkles
            className={cn(
              "h-4 w-4 relative z-10 transition-all",
              loadingAction === "refine" &&
                "animate-pulse text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
            )}
          />
          <span className="relative z-10 font-medium">
            {loadingAction === "refine" ? LOADING_MESSAGES[loadingMessageIndex] : "AI Refine"}
          </span>
        </Button>

        {/* AI Estimate Button */}
        <Button
          variant="neutral-primary"
          size="sm"
          className={cn(
            "gap-2 relative overflow-hidden transition-all duration-300",
            loadingAction === "estimate" &&
              "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/50"
          )}
          disabled={disabled || isLoading}
          onClick={() => handleAction("estimate", onEstimate)}
        >
          {loadingAction === "estimate" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 animate-shimmer" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </>
          )}
          <Sparkles
            className={cn(
              "h-4 w-4 relative z-10 transition-all",
              loadingAction === "estimate" &&
                "animate-pulse text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            )}
          />
          <span className="relative z-10 font-medium">
            {loadingAction === "estimate" ? LOADING_MESSAGES[loadingMessageIndex] : "AI Estimate"}
          </span>
        </Button>

        {/* AI Breakdown Button */}
        <Button
          variant="primary"
          size="sm"
          className={cn(
            "gap-2 relative overflow-hidden transition-all duration-300 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600",
            loadingAction === "breakdown" && "animate-pulse-glow"
          )}
          disabled={disabled || isLoading}
          onClick={() => handleAction("breakdown", onBreakdown)}
        >
          {loadingAction === "breakdown" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 via-amber-400/30 to-orange-400/30 animate-shimmer" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </>
          )}
          <Sparkles
            className={cn(
              "h-4 w-4 relative z-10 transition-all",
              loadingAction === "breakdown" &&
                "animate-spin-slow drop-shadow-[0_0_10px_rgba(251,146,60,0.9)]"
            )}
          />
          <span className="relative z-10 font-medium">
            {loadingAction === "breakdown" ? LOADING_MESSAGES[loadingMessageIndex] : "AI Breakdown"}
          </span>
        </Button>
      </div>

      {/* Streaming Text Display - Real-time */}
      {isStreaming && streamedText && (
        <div className="relative overflow-hidden rounded-lg border border-custom-border-200 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-purple-500/5 p-4 animate-float">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          <div className="relative z-10 flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 text-purple-500 animate-pulse drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-custom-text-200 leading-relaxed">
                {streamedText}
                <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-blink rounded-sm" />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Responses with Regenerate */}
      {responses.length > 0 && (
        <div className="space-y-3">
          {responses.map((response, index) => (
            <AIResponseCard
              key={`${response.action}-${index}`}
              title={getActionTitle(response.action)}
              content={response.content}
              confidence={response.confidence}
              onRegenerate={() => handleRegenerate(response.action, index)}
              isRegenerating={regeneratingId === `${response.action}-${index}`}
            />
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5">
          <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
        </div>
      )}
    </div>
  );
};
