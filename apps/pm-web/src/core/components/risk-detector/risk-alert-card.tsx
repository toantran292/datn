"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import {
  type RiskAlert,
  RiskSeverityColors,
  RiskSeverityLabels,
  RiskTypeIcons,
  RiskTypeLabels,
} from "@/core/types/risk-detector";
import { RiskRecommendationList } from "./risk-recommendation-list";

export interface RiskAlertCardProps {
  risk: RiskAlert;
  onAcknowledge?: (riskId: string, notes?: string) => void;
  onResolve?: (riskId: string, resolution: string, actionsTaken?: string[]) => void;
  onDismiss?: (riskId: string, reason: string) => void;
  onApplyRecommendation?: (recommendationId: string) => void;
  isExpanded?: boolean;
  issueNameLookup?: Record<string, string>;
}

export const RiskAlertCard: React.FC<RiskAlertCardProps> = ({
  risk,
  onAcknowledge,
  onResolve,
  onDismiss,
  onApplyRecommendation,
  isExpanded = true,
  issueNameLookup,
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const [showActions, setShowActions] = useState(false);

  const severityColor = RiskSeverityColors[risk.severity];
  const severityLabel = RiskSeverityLabels[risk.severity];
  const typeIcon = RiskTypeIcons[risk.riskType];
  const typeLabel = RiskTypeLabels[risk.riskType];

  const isActive = risk.status === "ACTIVE";
  const isAcknowledged = risk.status === "ACKNOWLEDGED";
  const isResolved = risk.status === "RESOLVED";
  const isDismissed = risk.status === "DISMISSED";

  // Mapping cho metadata keys sang tiếng Việt
  const metadataLabels: Record<string, string> = {
    avgVelocity: "Velocity trung bình",
    excessPoints: "Điểm vượt quá",
    committedPoints: "Điểm đã cam kết",
    recommendedPoints: "Điểm khuyến nghị",
    overcommitmentRatio: "Tỷ lệ quá tải",
    overcommitmentPercentage: "Phần trăm quá tải",
    blockedIssuesCount: "Số công việc bị chặn",
    totalIssuesCount: "Tổng số công việc",
    blockagePercentage: "Phần trăm bị chặn",
  };

  const getBorderColor = () => {
    switch (severityColor) {
      case "red":
        return "border-red-500/50";
      case "yellow":
        return "border-yellow-500/50";
      case "blue":
        return "border-blue-500/50";
      default:
        return "border-custom-border-200";
    }
  };

  const getBgColor = () => {
    if (isResolved) return "bg-green-500/5";
    if (isDismissed) return "bg-custom-background-80";
    switch (severityColor) {
      case "red":
        return "bg-red-500/5";
      case "yellow":
        return "bg-yellow-500/5";
      case "blue":
        return "bg-blue-500/5";
      default:
        return "bg-custom-background-90";
    }
  };

  const getSeverityBadgeColor = () => {
    switch (severityColor) {
      case "red":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "yellow":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "blue":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      default:
        return "bg-custom-background-80 text-custom-text-300";
    }
  };

  const handleAcknowledge = () => {
    if (onAcknowledge) {
      onAcknowledge(risk.id);
      setShowActions(false);
    }
  };

  const handleResolve = () => {
    if (onResolve) {
      const resolution = "Risk has been mitigated";
      onResolve(risk.id, resolution);
      setShowActions(false);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      const reason = "Not applicable";
      onDismiss(risk.id, reason);
      setShowActions(false);
    }
  };

  return (
    <div
      className={`border ${getBorderColor()} ${getBgColor()} rounded-lg overflow-hidden transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-custom-border-200">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl">{typeIcon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-custom-text-100">
                {risk.title}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${getSeverityBadgeColor()}`}
              >
                {severityLabel}
              </span>
              {isAcknowledged && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Đã xác nhận
                </span>
              )}
              {isResolved && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  Đã giải quyết
                </span>
              )}
              {isDismissed && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-custom-background-80 text-custom-text-400">
                  Đã bỏ qua
                </span>
              )}
            </div>
            <p className="text-xs text-custom-text-300">{typeLabel}</p>
            {risk.impactScore && (
              <div className="mt-1">
                <span className="text-xs text-custom-text-300">
                  Điểm tác động: <span className="font-medium">{risk.impactScore}/10</span>
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="size-7 rounded grid place-items-center hover:bg-custom-background-80 transition-colors"
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
          {/* Description */}
          <div className="px-4 py-3 border-b border-custom-border-200">
            <p className="text-sm text-custom-text-200 whitespace-pre-wrap">
              {risk.description}
            </p>
          </div>

          {/* Metadata */}
          {risk.metadata && Object.keys(risk.metadata).length > 0 && (
            <div className="px-4 py-3 border-b border-custom-border-200 bg-custom-background-100">
              <p className="text-xs font-medium text-custom-text-200 mb-2">Chi tiết:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(risk.metadata).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-custom-text-400">{metadataLabels[key] || key}: </span>
                    <span className="text-custom-text-200 font-medium">
                      {typeof value === "number" ? value.toFixed(2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {risk.recommendations && risk.recommendations.length > 0 && (
            <div className="px-4 py-3 border-b border-custom-border-200">
              <p className="text-xs font-medium text-custom-text-200 mb-3">
                Khuyến nghị:
              </p>
              <RiskRecommendationList
                recommendations={risk.recommendations}
                onApply={onApplyRecommendation}
                issueNameLookup={issueNameLookup}
              />
            </div>
          )}

          {/* Actions */}
          {isActive && (onAcknowledge || onResolve || onDismiss) && (
            <div className="px-4 py-3 bg-custom-background-100">
              {!showActions ? (
                <Button
                  variant="neutral-primary"
                  size="sm"
                  onClick={() => setShowActions(true)}
                  className="w-full"
                >
                  Hành động
                </Button>
              ) : (
                <div className="flex gap-2">
                  {onAcknowledge && (
                    <Button
                      variant="neutral-primary"
                      size="sm"
                      onClick={handleAcknowledge}
                      className="flex-1"
                    >
                      <AlertTriangle className="size-3.5 mr-1.5" />
                      Xác nhận
                    </Button>
                  )}
                  {onResolve && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleResolve}
                      className="flex-1"
                    >
                      <CheckCircle2 className="size-3.5 mr-1.5" />
                      Đã giải quyết
                    </Button>
                  )}
                  {onDismiss && (
                    <Button
                      variant="neutral-primary"
                      size="sm"
                      onClick={handleDismiss}
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {isAcknowledged && (onResolve || onDismiss) && (
            <div className="px-4 py-3 bg-custom-background-100">
              <div className="flex gap-2">
                {onResolve && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleResolve}
                    className="flex-1"
                  >
                    <CheckCircle2 className="size-3.5 mr-1.5" />
                    Đã giải quyết
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Detected timestamp */}
      <div className="px-4 py-2 text-xs text-custom-text-400 bg-custom-background-100">
        Phát hiện: {new Date(risk.detectedAt).toLocaleString("vi-VN")}
      </div>
    </div>
  );
};
