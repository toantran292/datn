"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, RefreshCw, Shield, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { riskDetectorService } from "@/core/services/risk-detector.service";
import type { RiskAlert, RiskSeverity, RiskAlertStatus } from "@/core/types/risk-detector";
import { RiskAlertCard } from "./risk-alert-card";

export interface SprintRisksDashboardProps {
  sprintId: string;
  sprintName?: string;
  onRecommendationApplied?: () => void;
  issues?: Array<{ id: string; name: string }>;
}

export const SprintRisksDashboard: React.FC<SprintRisksDashboardProps> = ({
  sprintId,
  sprintName,
  onRecommendationApplied,
  issues = [],
}) => {
  const [risks, setRisks] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<RiskSeverity | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<RiskAlertStatus | "ALL">("ACTIVE");
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filterStatus !== "ALL") params.status = filterStatus;
      if (filterSeverity !== "ALL") params.severity = filterSeverity;

      const response = await riskDetectorService.getSprintRisks(sprintId, params);
      if (response.success && response.risks) {
        setRisks(response.risks);
      } else {
        setError("Không thể tải dữ liệu risk alerts");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải risk alerts");
    } finally {
      setLoading(false);
    }
  };

  const detectRisks = async () => {
    try {
      setDetecting(true);
      setError(null);
      const response = await riskDetectorService.detectSprintRisks(sprintId);
      if (response.success) {
        // Refresh risks list after detection
        await fetchRisks();
      } else {
        setError("Không thể detect risks");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi detect risks");
    } finally {
      setDetecting(false);
    }
  };

  const handleAcknowledge = async (riskId: string, notes?: string) => {
    try {
      const response = await riskDetectorService.acknowledgeRisk(riskId, { notes });
      if (response.success) {
        await fetchRisks();
      }
    } catch (err: any) {
      console.error("Error acknowledging risk:", err);
    }
  };

  const handleResolve = async (riskId: string, resolution: string, actionsTaken?: string[]) => {
    try {
      const response = await riskDetectorService.resolveRisk(riskId, {
        resolution,
        actionsTaken,
      });
      if (response.success) {
        await fetchRisks();
      }
    } catch (err: any) {
      console.error("Error resolving risk:", err);
    }
  };

  const handleDismiss = async (riskId: string, reason: string) => {
    try {
      const response = await riskDetectorService.dismissRisk(riskId, { reason });
      if (response.success) {
        await fetchRisks();
      }
    } catch (err: any) {
      console.error("Error dismissing risk:", err);
    }
  };

  const handleApplyRecommendation = async (recommendationId: string) => {
    try {
      const response = await riskDetectorService.applyRecommendation(recommendationId);
      if (response.success) {
        // Show success message
        console.log(`Applied recommendation: ${response.issuesMoved} issues moved to backlog`);
        // Refresh risks to update the recommendation status
        await fetchRisks();
        // Notify parent to refetch issues for UI update
        onRecommendationApplied?.();
      }
    } catch (err: any) {
      console.error("Error applying recommendation:", err);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [sprintId, filterSeverity, filterStatus]);

  const activeCriticalRisks = risks.filter(
    (r) => r.status === "ACTIVE" && r.severity === "CRITICAL"
  ).length;
  const activeMediumRisks = risks.filter(
    (r) => r.status === "ACTIVE" && r.severity === "MEDIUM"
  ).length;
  const activeLowRisks = risks.filter(
    (r) => r.status === "ACTIVE" && r.severity === "LOW"
  ).length;

  // Create issue name lookup for recommendations
  const issueNameLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    issues.forEach((issue) => {
      lookup[issue.id] = issue.name;
    });
    return lookup;
  }, [issues]);

  return (
    <div className="border border-custom-border-200 rounded-lg bg-custom-background-100">
      {/* Collapsible Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-custom-background-90 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-custom-primary-100/10 grid place-items-center">
            <Shield className="size-5 text-custom-primary-100" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-custom-text-100">
              Risk Alerts
              {sprintName && (
                <span className="ml-2 text-sm font-normal text-custom-text-300">
                  • {sprintName}
                </span>
              )}
            </h2>
            <p className="text-xs text-custom-text-300">
              {activeCriticalRisks + activeMediumRisks + activeLowRisks} risks đang hoạt động
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <>
              <Button
                variant="neutral-primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchRisks();
                }}
                disabled={loading}
              >
                <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  detectRisks();
                }}
                disabled={detecting}
              >
                <AlertTriangle className={`size-3.5 mr-1.5 ${detecting ? "animate-pulse" : ""}`} />
                Detect Risks
              </Button>
            </>
          )}
          <button className="size-7 rounded grid place-items-center hover:bg-custom-background-80 transition-colors">
            {isExpanded ? (
              <ChevronUp className="size-4 text-custom-text-300" />
            ) : (
              <ChevronDown className="size-4 text-custom-text-300" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto border-t border-custom-border-200">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
        <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="size-4 text-red-500" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              Nghiêm Trọng
            </span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {activeCriticalRisks}
          </div>
        </div>
        <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="size-4 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
              Trung Bình
            </span>
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {activeMediumRisks}
          </div>
        </div>
        <div className="border border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="size-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Thấp</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {activeLowRisks}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 p-3 border border-custom-border-200 rounded-lg bg-custom-background-100">
        <Filter className="size-4 text-custom-text-300" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-custom-text-300">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="text-xs px-2 py-1 rounded border border-custom-border-200 bg-custom-background-100 text-custom-text-200"
          >
            <option value="ALL">Tất cả</option>
            <option value="CRITICAL">Nghiêm trọng</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="LOW">Thấp</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-custom-text-300">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs px-2 py-1 rounded border border-custom-border-200 bg-custom-background-100 text-custom-text-200"
          >
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="ACKNOWLEDGED">Đã xác nhận</option>
            <option value="RESOLVED">Đã giải quyết</option>
            <option value="DISMISSED">Đã bỏ qua</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-8 text-center">
          <RefreshCw className="size-6 text-custom-text-300 animate-spin mx-auto mb-2" />
          <p className="text-sm text-custom-text-300">Đang tải risk alerts...</p>
        </div>
      )}

      {/* Risk Alerts List */}
      {!loading && !error && (
        <div className="space-y-3">
          {risks.length === 0 ? (
            <div className="p-8 text-center border border-custom-border-200 rounded-lg bg-custom-background-100">
              <Shield className="size-12 text-custom-text-300 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-custom-text-200 mb-1">
                Không có risk alerts
              </p>
              <p className="text-xs text-custom-text-400">
                Sprint đang trong tình trạng tốt! Nhấn "Detect Risks" để kiểm tra lại.
              </p>
            </div>
          ) : (
            risks.map((risk) => (
              <RiskAlertCard
                key={risk.id}
                risk={risk}
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
                onDismiss={handleDismiss}
                onApplyRecommendation={handleApplyRecommendation}
                issueNameLookup={issueNameLookup}
              />
            ))
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
};
