"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import type { EstimatePointsData } from "@/core/types/ai";

export interface AIEstimateSectionProps {
  estimation: EstimatePointsData;
  onAccept: (points: number) => void;
  onCancel: () => void;
  isExpanded?: boolean;
}

export const AIEstimateSection: React.FC<AIEstimateSectionProps> = ({
  estimation,
  onAccept,
  onCancel,
  isExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(isExpanded);

  const getConfidenceLabel = (confidence: number): { label: string; color: string } => {
    if (confidence >= 0.8) return { label: "Cao", color: "text-green-600" };
    if (confidence >= 0.5) return { label: "Trung bình", color: "text-yellow-600" };
    return { label: "Thấp", color: "text-red-600" };
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case "High":
        return "text-red-600 bg-red-50";
      case "Medium":
        return "text-yellow-600 bg-yellow-50";
      case "Low":
        return "text-green-600 bg-green-50";
      default:
        return "text-custom-text-300 bg-custom-background-90";
    }
  };

  const confidenceInfo = getConfidenceLabel(estimation.confidence);

  return (
    <div className="border border-custom-border-200 rounded-lg bg-custom-background-90 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-custom-primary-100/5 border-b border-custom-border-200">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-custom-primary-100/10 grid place-items-center">
            <Sparkles className="size-4 text-custom-primary-100" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-custom-text-100">AI Story Points Estimation</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-custom-text-300">
                Độ tin cậy:{" "}
                <span className={`font-medium ${confidenceInfo.color}`}>
                  {confidenceInfo.label} ({Math.round(estimation.confidence * 100)}%)
                </span>
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="size-7 rounded grid place-items-center hover:bg-custom-background-80 transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <ChevronUp className="size-4 text-custom-text-300" />
          ) : (
            <ChevronDown className="size-4 text-custom-text-300" />
          )}
        </button>
      </div>

      {expanded && (
        <>
          {/* Suggested Points */}
          <div className="px-4 py-4 bg-custom-background-100 border-b border-custom-border-200">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-lg bg-custom-primary-100/10 grid place-items-center">
                <span className="text-2xl font-bold text-custom-primary-100">
                  {estimation.suggestedPoints}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-custom-text-200 uppercase tracking-wide mb-1">
                  Điểm đề xuất
                </p>
                <p className="text-sm text-custom-text-300">{estimation.reasoning.summary}</p>
              </div>
            </div>
          </div>

          {/* Reasoning Factors */}
          <div className="px-4 py-3 bg-custom-background-100 border-b border-custom-border-200">
            <p className="text-xs font-medium text-custom-text-200 uppercase tracking-wide mb-3">
              Các yếu tố đánh giá
            </p>
            <div className="space-y-2">
              {estimation.reasoning.factors.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 p-2.5 rounded-md bg-custom-background-90 border border-custom-border-200"
                >
                  <div className={`px-2 py-0.5 rounded text-xs font-medium ${getImpactColor(factor.impact)}`}>
                    {factor.impact}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-custom-text-100">{factor.factor}</p>
                    <p className="text-xs text-custom-text-300 mt-0.5">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alternatives */}
          {estimation.alternatives && estimation.alternatives.length > 0 && (
            <div className="px-4 py-3 bg-custom-background-100 border-b border-custom-border-200">
              <p className="text-xs font-medium text-custom-text-200 uppercase tracking-wide mb-2">
                Ước lượng thay thế
              </p>
              <div className="space-y-1.5">
                {estimation.alternatives.map((alt, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs text-custom-text-300 p-2 rounded bg-custom-background-90"
                  >
                    <TrendingUp className="size-3.5 mt-0.5 flex-shrink-0 text-custom-primary-100" />
                    <span>
                      <span className="font-semibold text-custom-text-200">{alt.points} điểm</span>{" "}
                      ({Math.round(alt.likelihood * 100)}% khả năng) - {alt.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {estimation.reasoning.recommendations && estimation.reasoning.recommendations.length > 0 && (
            <div className="px-4 py-3 bg-custom-background-100 border-b border-custom-border-200">
              <p className="text-xs font-medium text-custom-text-200 uppercase tracking-wide mb-2">
                Khuyến nghị
              </p>
              <div className="space-y-1.5">
                {estimation.reasoning.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-custom-text-300">
                    <AlertCircle className="size-3.5 mt-0.5 flex-shrink-0 text-yellow-500" />
                    <span>{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-4 py-3 bg-custom-background-100">
            <div className="text-xs text-custom-text-400">
              AI Estimation • GPT-4o-mini
            </div>
            <div className="flex items-center gap-2">
              <Button variant="neutral-primary" size="sm" onClick={onCancel}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={() => onAccept(estimation.suggestedPoints)}>
                Áp dụng {estimation.suggestedPoints} điểm
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
