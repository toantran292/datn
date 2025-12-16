"use client";

import { Lightbulb, Target, Clock, Play } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import type { RiskRecommendation } from "@/core/types/risk-detector";

export interface RiskRecommendationListProps {
  recommendations: RiskRecommendation[];
  onApply?: (recommendationId: string) => void;
  issueNameLookup?: Record<string, string>;
}

export const RiskRecommendationList: React.FC<RiskRecommendationListProps> = ({
  recommendations,
  onApply,
  issueNameLookup = {},
}) => {
  // Sort recommendations by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => a.priority - b.priority);

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "text-red-500";
    if (priority === 2) return "text-yellow-500";
    return "text-blue-500";
  };

  const getPriorityBg = (priority: number) => {
    if (priority === 1) return "bg-red-500/10";
    if (priority === 2) return "bg-yellow-500/10";
    return "bg-blue-500/10";
  };

  return (
    <div className="space-y-3">
      {sortedRecommendations.map((recommendation, index) => (
        <div
          key={index}
          className="border border-custom-border-200 rounded-lg p-3 bg-custom-background-100 hover:bg-custom-background-90 transition-colors"
        >
          {/* Header with priority */}
          <div className="flex items-start gap-2.5 mb-2">
            <div
              className={`size-6 rounded-full ${getPriorityBg(recommendation.priority)} grid place-items-center flex-shrink-0`}
            >
              <span className={`text-xs font-bold ${getPriorityColor(recommendation.priority)}`}>
                {recommendation.priority}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="size-3.5 text-custom-text-300" />
                <h4 className="text-xs font-semibold text-custom-text-100">
                  Hành động khuyến nghị
                </h4>
              </div>
              <p className="text-sm text-custom-text-200">{recommendation.action}</p>
            </div>
          </div>

          {/* Expected Impact */}
          <div className="flex items-start gap-2 ml-8 mb-2">
            <Target className="size-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-custom-text-300 mb-0.5">
                Tác động dự kiến:
              </p>
              <p className="text-sm text-custom-text-200">{recommendation.expectedImpact}</p>
            </div>
          </div>

          {/* Effort Estimate */}
          {recommendation.effortEstimate && (
            <div className="flex items-start gap-2 ml-8 mb-2">
              <Clock className="size-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-custom-text-300 mb-0.5">
                  Thời gian ước tính:
                </p>
                <p className="text-sm text-custom-text-200">{recommendation.effortEstimate}</p>
              </div>
            </div>
          )}

          {/* Suggested Issues */}
          {recommendation.suggestedIssues && recommendation.suggestedIssues.length > 0 && (
            <div className="ml-8 mt-2 pt-2 border-t border-custom-border-200">
              <p className="text-xs font-medium text-custom-text-300 mb-1.5">
                Issues được đề xuất:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recommendation.suggestedIssues.map((issueId) => {
                  const issueName = issueNameLookup[issueId];
                  return (
                    <span
                      key={issueId}
                      className="text-xs px-2 py-1 rounded bg-custom-primary-100/10 text-custom-primary-100"
                      title={issueName ? `${issueName} (${issueId})` : issueId}
                    >
                      {issueName || `${issueId.slice(0, 8)}...`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status badge */}
          {recommendation.status && recommendation.status !== "PENDING" && (
            <div className="ml-8 mt-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  recommendation.status === "APPLIED"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {recommendation.status === "APPLIED" ? "Đã áp dụng" : "Đã từ chối"}
              </span>
            </div>
          )}

          {/* Apply button */}
          {recommendation.id &&
            (!recommendation.status || recommendation.status === "PENDING") &&
            recommendation.suggestedIssues &&
            recommendation.suggestedIssues.length > 0 &&
            onApply && (
              <div className="ml-8 mt-3 pt-2 border-t border-custom-border-200">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApply(recommendation.id!)}
                  className="w-full"
                >
                  <Play className="size-3.5 mr-1.5" />
                  Áp dụng khuyến nghị này
                </Button>
              </div>
            )}
        </div>
      ))}
    </div>
  );
};
