"use client";

import { Fragment } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Star,
  MessageSquare,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";
import type { SprintSummaryData, SprintSentiment, SeverityLevel, PriorityLevel } from "@/core/types/ai-sprint-summary";

export interface AISprintSummaryContentProps {
  summary: SprintSummaryData | null;
  isLoading?: boolean;
  onClose?: () => void;
}

const SENTIMENT_CONFIG: Record<SprintSentiment, { color: string; bgColor: string; icon: typeof TrendingUp }> = {
  positive: {
    color: "text-green-600",
    bgColor: "bg-green-50",
    icon: TrendingUp,
  },
  neutral: {
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    icon: BarChart3,
  },
  needs_improvement: {
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    icon: TrendingDown,
  },
};

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  low: "text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  medium: "text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  high: "text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
};

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: "text-gray-600",
  medium: "text-yellow-600",
  high: "text-red-600",
};

export const AISprintSummaryContent: React.FC<AISprintSummaryContentProps> = ({
  summary,
  isLoading = false,
  onClose,
}) => {
  // Always render something - don't return null!
  const sentimentConfig = summary ? SENTIMENT_CONFIG[summary.overview.overallSentiment] : SENTIMENT_CONFIG.neutral;
  const SentimentIcon = sentimentConfig.icon;

  return (
    <div className="space-y-5 p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-gradient-to-br from-custom-primary-100 to-purple-500 grid place-items-center shadow-lg">
            <Sparkles className="size-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-custom-text-100">AI Sprint Summary</h2>
            {summary && (
              <p className="text-sm text-custom-text-300 mt-0.5">
                {summary.overview.sprintName} • {summary.overview.duration} ngày
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        {isLoading || !summary ? (
          <div className="space-y-4">
            <div className="text-center py-12">
              <div className="size-16 mx-auto rounded-full bg-custom-primary-100/10 grid place-items-center mb-4">
                <Sparkles className="size-8 text-custom-primary-100 animate-spin-slow" />
              </div>
              <p className="text-sm font-medium text-custom-text-200">Đang phân tích sprint...</p>
              <p className="text-xs text-custom-text-400 mt-1">AI đang thu thập dữ liệu và tạo insights</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className={cn("p-5 rounded-xl border-2", sentimentConfig.bgColor, "border-current/20")}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <SentimentIcon className={cn("size-8", sentimentConfig.color)} />
                  <div>
                    <h3 className="text-lg font-bold text-custom-text-100">Tổng Quan Sprint</h3>
                    <p className="text-sm text-custom-text-300">
                      {new Date(summary.overview.startDate).toLocaleDateString("vi-VN")} -{" "}
                      {new Date(summary.overview.endDate).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-custom-background-100 border border-custom-border-200">
                  <div className="text-xs text-custom-text-400 mb-1">Completion Rate</div>
                  <div className="text-2xl font-bold text-custom-primary-100">
                    {Math.round(summary.overview.completionRate * 100)}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-custom-background-100 border border-custom-border-200">
                  <div className="text-xs text-custom-text-400 mb-1">Velocity</div>
                  <div className="text-2xl font-bold text-custom-primary-100">{summary.overview.velocityScore} pts</div>
                </div>
                <div className="p-3 rounded-lg bg-custom-background-100 border border-custom-border-200">
                  <div className="text-xs text-custom-text-400 mb-1">Issues</div>
                  <div className="text-2xl font-bold text-custom-text-100">
                    {summary.metadata.completedIssues}/{summary.metadata.totalIssues}
                  </div>
                </div>
              </div>
            </div>

            {/* Positives */}
            {summary.positives.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="size-5 text-green-500" />
                  <h3 className="text-base font-bold text-custom-text-100">Điểm Tích Cực</h3>
                </div>
                <div className="space-y-2">
                  {summary.positives.map((positive, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-custom-background-90 border border-custom-border-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-custom-text-100 mb-1">
                            {positive.title}
                          </h4>
                          <p className="text-xs text-custom-text-300">{positive.description}</p>
                        </div>
                        {positive.metric && (
                          <div className="px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                              {positive.metric.value}
                              {positive.metric.unit || ""}
                            </span>
                            {positive.metric.change !== undefined && (
                              <span
                                className={cn(
                                  "text-xs ml-1",
                                  positive.metric.change > 0 ? "text-green-600" : "text-red-600"
                                )}
                              >
                                {positive.metric.change > 0 ? "+" : ""}
                                {positive.metric.change}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concerns */}
            {summary.concerns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="size-5 text-orange-500" />
                  <h3 className="text-base font-bold text-custom-text-100">Điểm Cần Lưu Ý</h3>
                </div>
                <div className="space-y-2">
                  {summary.concerns.map((concern, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-custom-background-90 border border-custom-border-200"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn("px-2 py-0.5 rounded text-xs font-medium", SEVERITY_COLORS[concern.severity])}
                        >
                          {concern.severity}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-custom-text-100 mb-1">
                            {concern.title}
                          </h4>
                          <p className="text-xs text-custom-text-300">{concern.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {summary.recommendations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="size-5 text-custom-primary-100" />
                  <h3 className="text-base font-bold text-custom-text-100">Gợi Ý Cải Thiện</h3>
                </div>
                <div className="space-y-2">
                  {summary.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-custom-background-90 border border-custom-border-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn("text-sm", PRIORITY_COLORS[rec.priority])}>
                          {rec.priority === "high" && "🔴"}
                          {rec.priority === "medium" && "🟡"}
                          {rec.priority === "low" && "⚪"}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-custom-text-100 mb-1">{rec.title}</h4>
                          <p className="text-xs text-custom-text-300">{rec.description}</p>
                        </div>
                        {rec.actionable && (
                          <span className="text-xs text-custom-primary-100 font-medium">Actionable</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {summary.strengths.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="size-5 text-amber-500" />
                  <h3 className="text-base font-bold text-custom-text-100">Điểm Mạnh Cần Phát Huy</h3>
                </div>
                <div className="space-y-2">
                  {summary.strengths.map((strength, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-custom-background-90 border border-custom-border-200"
                    >
                      <h4 className="text-sm font-semibold text-custom-text-100 mb-1">
                        {strength.title}
                      </h4>
                      <p className="text-xs text-custom-text-300">{strength.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Closing Message */}
            {summary.closingMessage && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-custom-primary-100/10 to-purple-500/10 border border-custom-primary-100/20">
                <div className="flex items-start gap-3">
                  <MessageSquare className="size-5 text-custom-primary-100 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-custom-text-200 leading-relaxed whitespace-pre-line">
                      {summary.closingMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-custom-border-200">
        <div className="text-xs text-custom-text-400">AI Sprint Analytics • GPT-4o-mini</div>
        {onClose && (
          <div className="flex items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
