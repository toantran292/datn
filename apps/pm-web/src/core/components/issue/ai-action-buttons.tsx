"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";

interface AIActionButtonsProps {
  onRefine?: () => Promise<string>;
  onEstimate?: () => Promise<string>;
  onBreakdown?: () => Promise<string>;
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

export const AIActionButtons: React.FC<AIActionButtonsProps> = ({
  onRefine,
  onEstimate,
  onBreakdown,
  disabled = false,
}) => {
  const [loadingAction, setLoadingAction] = useState<AIAction>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Cycle through loading messages
  useEffect(() => {
    if (!loadingAction) return;

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [loadingAction]);

  // Streaming text effect like ChatGPT
  const streamText = async (text: string) => {
    setIsStreaming(true);
    setStreamingText("");

    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      setStreamingText((prev) => (prev ? prev + " " + words[i] : words[i]));
    }

    setIsStreaming(false);
    // Clear after showing
    setTimeout(() => {
      setStreamingText("");
    }, 5000);
  };

  const handleAction = async (action: AIAction, handler?: () => Promise<string>) => {
    if (!handler || loadingAction) return;

    try {
      setLoadingAction(action);
      setLoadingMessageIndex(0);
      const result = await handler();
      setLoadingAction(null);
      await streamText(result);
    } catch (error) {
      setLoadingAction(null);
      console.error(`AI ${action} error:`, error);
    }
  };

  const isLoading = loadingAction !== null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* AI Refine Button */}
        <Button
          variant="neutral-primary"
          size="sm"
          className={cn(
            "gap-2 relative overflow-hidden transition-all duration-300",
            loadingAction === "refine" && "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/50"
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
              loadingAction === "refine" && "animate-pulse text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
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
            loadingAction === "estimate" && "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/50"
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
              loadingAction === "estimate" && "animate-pulse text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            )}
          />
          <span className="relative z-10 font-medium">
            {loadingAction === "estimate" ? LOADING_MESSAGES[loadingMessageIndex] : "AI Estimate"}
          </span>
        </Button>

        {/* AI Breakdown Button - Primary */}
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
              loadingAction === "breakdown" && "animate-spin-slow drop-shadow-[0_0_10px_rgba(251,146,60,0.9)]"
            )}
          />
          <span className="relative z-10 font-medium">
            {loadingAction === "breakdown" ? LOADING_MESSAGES[loadingMessageIndex] : "AI Breakdown"}
          </span>
        </Button>
      </div>

      {/* Streaming Text Display - ChatGPT Style */}
      {streamingText && (
        <div className="relative overflow-hidden rounded-lg border border-custom-border-200 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-purple-500/5 p-4 animate-float">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          <div className="relative z-10 flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 text-purple-500 animate-pulse drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-custom-text-200 leading-relaxed">
                {streamingText}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-blink rounded-sm" />
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
