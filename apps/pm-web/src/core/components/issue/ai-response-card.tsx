"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";

interface AIResponseCardProps {
  title: string;
  content: string;
  confidence?: number; // 0-100
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  className?: string;
}

export const AIResponseCard: React.FC<AIResponseCardProps> = ({
  title,
  content,
  confidence = 95,
  onRegenerate,
  isRegenerating = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return "Độ tin cậy cao";
    if (score >= 70) return "Độ tin cậy trung bình";
    return "Độ tin cậy thấp";
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-custom-border-200 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-purple-500/5",
        "animate-float",
        className
      )}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

      {/* Header */}
      <div className="relative z-10 p-4 border-b border-custom-border-200 bg-custom-background-100/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
              <Sparkles className="h-5 w-5 text-purple-500 animate-pulse drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-custom-text-100">
                {title}
              </h3>
              <p className="text-xs text-custom-text-400">{getConfidenceLabel(confidence)}</p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="size-7 rounded grid place-items-center hover:bg-custom-background-80 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="size-4 text-custom-text-300" />
            ) : (
              <ChevronDown className="size-4 text-custom-text-300" />
            )}
          </button>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 flex-wrap">
          {confidence && (
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-md font-medium inline-flex items-center gap-1",
                getConfidenceColor(confidence)
              )}
              title={getConfidenceLabel(confidence)}
            >
              <span className="text-xs">Độ tin cậy:</span>
              <span className="font-semibold">{confidence}%</span>
            </span>
          )}

          {onRegenerate && (
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="gap-2"
              title="Regenerate response"
            >
              <RefreshCw className={cn("h-4 w-4", isRegenerating && "animate-spin")} />
              <span className="text-sm font-medium">Regenerate</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="relative z-10 p-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-custom-text-200 leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
