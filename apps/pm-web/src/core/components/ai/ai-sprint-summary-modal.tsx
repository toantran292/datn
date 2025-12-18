"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
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
import type {
  SprintSummaryData,
  SprintSentiment,
  SeverityLevel,
  PriorityLevel,
} from "@/core/types/ai-sprint-summary";

export interface AISprintSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SprintSummaryData | null;
  isLoading?: boolean;
}

const SENTIMENT_CONFIG: Record<
  SprintSentiment,
  { color: string; bgColor: string; icon: typeof TrendingUp }
> = {
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
  low: "text-blue-600 bg-blue-50",
  medium: "text-yellow-600 bg-yellow-50",
  high: "text-red-600 bg-red-50",
};

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: "text-gray-600",
  medium: "text-yellow-600",
  high: "text-red-600",
};

export const AISprintSummaryModal: React.FC<AISprintSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  isLoading = false,
}) => {
  if (!summary && !isLoading) return null;

  const sentimentConfig = summary
    ? SENTIMENT_CONFIG[summary.overview.overallSentiment]
    : SENTIMENT_CONFIG.neutral;
  const SentimentIcon = sentimentConfig.icon;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-custom-background-100 shadow-2xl transition-all">
                {/* Header */}
                <div className="relative px-6 py-5 border-b border-custom-border-200 bg-gradient-to-r from-custom-primary-100/10 to-purple-500/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-xl bg-gradient-to-br from-custom-primary-100 to-purple-500 grid place-items-center shadow-lg">
                        <Sparkles className="size-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-bold text-custom-text-100">
                          AI Sprint Summary
                        </Dialog.Title>
                        {summary && (
                          <p className="text-sm text-custom-text-300 mt-0.5">
                            {summary.overview.sprintName} • {summary.overview.duration} ngày
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="size-8 rounded-lg hover:bg-custom-background-80 transition-colors grid place-items-center"
                    >
                      <X className="size-5 text-custom-text-300" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-5">
                  {isLoading || !summary ? (
                    <div className="space-y-4">
                      <div className="text-center py-12">
                        <div className="size-16 mx-auto rounded-full bg-custom-primary-100/10 grid place-items-center mb-4">
                          <Sparkles className="size-8 text-custom-primary-100 animate-spin-slow" />
                        </div>
                        <p className="text-sm font-medium text-custom-text-200">
                          Đang phân tích sprint...
                        </p>
                        <p className="text-xs text-custom-text-400 mt-1">
                          AI đang thu thập dữ liệu và tạo insights
                        </p>
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
                              <h3 className="text-lg font-bold text-custom-text-100">
                                Tổng Quan Sprint
                              </h3>
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
                            <div className="text-2xl font-bold text-custom-primary-100">
                              {summary.overview.velocityScore} pts
                            </div>
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
                            <h3 className="text-base font-bold text-custom-text-100">
                              Điểm Tích Cực
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {summary.positives.map((positive, index) => (
                              <div
                                key={index}
                                className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                                      {positive.title}
                                    </h4>
                                    <p className="text-xs text-green-700 dark:text-green-300">
                                      {positive.description}
                                    </p>
                                  </div>
                                  {positive.metric && (
                                    <div className="px-3 py-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
                                      <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                        {positive.metric.value}
                                        {positive.metric.unit || ""}
                                      </span>
                                      {positive.metric.change !== undefined && (
                                        <span
                                          className={cn(
                                            "text-xs ml-1",
                                            positive.metric.change > 0
                                              ? "text-green-600"
                                              : "text-red-600"
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
                            <AlertCircle className="size-5 text-yellow-500" />
                            <h3 className="text-base font-bold text-custom-text-100">
                              Điểm Cần Lưu Ý
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {summary.concerns.map((concern, index) => (
                              <div
                                key={index}
                                className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800"
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded text-xs font-medium",
                                      SEVERITY_COLORS[concern.severity]
                                    )}
                                  >
                                    {concern.severity}
                                  </span>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                                      {concern.title}
                                    </h4>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                      {concern.description}
                                    </p>
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
                            <Lightbulb className="size-5 text-blue-500" />
                            <h3 className="text-base font-bold text-custom-text-100">
                              Gợi Ý Cải Thiện
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {summary.recommendations.map((rec, index) => (
                              <div
                                key={index}
                                className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"
                              >
                                <div className="flex items-start gap-3">
                                  <span className={cn("text-sm", PRIORITY_COLORS[rec.priority])}>
                                    {rec.priority === "high" && "🔴"}
                                    {rec.priority === "medium" && "🟡"}
                                    {rec.priority === "low" && "⚪"}
                                  </span>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                      {rec.title}
                                    </h4>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                      {rec.description}
                                    </p>
                                  </div>
                                  {rec.actionable && (
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                      Actionable
                                    </span>
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
                            <Star className="size-5 text-purple-500" />
                            <h3 className="text-base font-bold text-custom-text-100">
                              Điểm Mạnh Cần Phát Huy
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {summary.strengths.map((strength, index) => (
                              <div
                                key={index}
                                className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800"
                              >
                                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                                  {strength.title}
                                </h4>
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                  {strength.description}
                                </p>
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
                <div className="px-6 py-4 border-t border-custom-border-200 bg-custom-background-90">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-custom-text-400">
                      AI Sprint Analytics • GPT-4o-mini
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="neutral-primary" size="sm" onClick={onClose}>
                        Đóng
                      </Button>
                      {/* Future: Export PDF button */}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
