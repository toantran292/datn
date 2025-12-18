"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, RefreshCw, Shield, ChevronDown, ChevronUp, Info, HelpCircle, TestTube } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { riskDetectorService } from "@/core/services/risk-detector.service";
import type { RiskAlert } from "@/core/types/risk-detector";
import { RiskAlertCard } from "./risk-alert-card";
import { RiskType } from "@/core/types/risk-detector";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [detectionResult, setDetectionResult] = useState<{
    totalChecked: number;
    risksFound: number;
    timestamp: Date;
    analysis?: {
      avgVelocity?: number;
      committedPoints?: number;
      capacityStatus?: 'UNDER' | 'OPTIMAL' | 'OVER';
      blockedIssuesCount?: number;
      totalIssuesCount?: number;
      dependenciesCount?: number;
      workloadDistribution?: Array<{
        memberId: string;
        memberName?: string;
        points: number;
        percentage: number;
      }>;
      missingEstimatesCount?: number;
    };
  } | null>(null);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await riskDetectorService.getSprintRisks(sprintId);
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
        // Store detection result for display
        const risksFound = response.detectedRisks || response.risks?.length || 0;

        // Extract analysis data from risks metadata
        const overcommitRisk = response.risks?.find(r => r.riskType === 'OVERCOMMITMENT');
        const blockageRisk = response.risks?.find(r => r.riskType === 'BLOCKED_ISSUES');

        setDetectionResult({
          totalChecked: response.totalChecked || 4,
          risksFound,
          timestamp: new Date(),
          analysis: {
            avgVelocity: overcommitRisk?.metadata?.avgVelocity as number | undefined,
            committedPoints: overcommitRisk?.metadata?.committedPoints as number | undefined,
            capacityStatus: overcommitRisk
              ? 'OVER'
              : (!overcommitRisk && response.risks && response.risks.length === 0)
                ? 'OPTIMAL'
                : 'OPTIMAL',
            blockedIssuesCount: blockageRisk?.metadata?.blockedIssuesCount as number | undefined,
            totalIssuesCount: blockageRisk?.metadata?.totalIssuesCount as number | undefined,
            dependenciesCount: 0,
          },
        });
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
  }, [sprintId]);

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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfoPanel(!showInfoPanel);
                }}
                className="size-7 rounded grid place-items-center hover:bg-custom-background-80 transition-colors"
                title="Thông tin về Risk Alerts"
              >
                <HelpCircle className="size-4 text-custom-text-300" />
              </button>
              <Button
                variant="neutral-primary"
                size="sm"
                onClick={(e: React.MouseEvent) => {
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
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  detectRisks();
                }}
                disabled={detecting}
                loading={detecting}
              >
                <AlertTriangle className="size-3.5 mr-1.5" />
                {detecting ? "Đang phân tích..." : "Phân tích Sprint"}
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
          {/* Info Panel */}
          {showInfoPanel && (
            <div className="border border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
              <div className="flex items-start gap-3">
                <Info className="size-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-custom-text-100">
                    Risk Alerts là gì?
                  </h3>
                  <p className="text-xs text-custom-text-300">
                    Tự động phân tích sprint và cảnh báo các vấn đề tiềm ẩn như: overcommitment,
                    blocked issues, dependencies, và thiếu estimates.
                  </p>
                  <div className="pt-2 border-t border-blue-500/20 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-custom-text-200 mb-1.5">
                        Khi nào nên dùng?
                      </p>
                      <ul className="text-xs text-custom-text-300 space-y-1">
                        <li>• Đầu sprint: Kiểm tra capacity phù hợp chưa</li>
                        <li>• Giữa sprint: Phát hiện blockers sớm</li>
                        <li>• Hàng ngày: Track tiến độ và dependencies</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-custom-text-200 mb-1.5">
                        Cách tính toán & Tiêu chí:
                      </p>
                      <ul className="text-xs text-custom-text-300 space-y-1">
                        <li>• <strong>Overcommitment:</strong> Committed points {'>'} Velocity × 110%</li>
                        <li>• <strong>Blocked Issues:</strong> {'>'} 20% issues đang bị block</li>
                        <li>• <strong>Zero Progress:</strong> Issues không update {'>'} 3 ngày</li>
                        <li>• <strong>Missing Estimates:</strong> {'>'} 20% issues thiếu story points</li>
                        <li>• <strong>Workload Imbalance:</strong> 1 member có {'>'} 50% tổng points</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detection Result - Minimal display */}
          {detectionResult && detectionResult.risksFound === 0 && (
            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
              <div className="flex items-start gap-3">
                <Shield className="size-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Sprint đang trong tình trạng tốt!
                    </p>
                    <p className="text-xs text-custom-text-400">
                      Phân tích lúc {detectionResult.timestamp.toLocaleTimeString("vi-VN")}
                    </p>
                  </div>

                  <div className="text-xs text-custom-text-300 space-y-1.5 pt-2 border-t border-green-500/20">
                    <p className="font-medium text-custom-text-200 mb-1.5">
                      Đã kiểm tra {detectionResult.totalChecked} tiêu chí:
                    </p>

                    {/* 1. Overcommitment */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <div>
                        <strong className="text-custom-text-200">Overcommitment:</strong>{' '}
                        {detectionResult.analysis?.avgVelocity && detectionResult.analysis?.committedPoints ? (
                          <>
                            {detectionResult.analysis.committedPoints.toFixed(0)}/{detectionResult.analysis.avgVelocity.toFixed(0)} points
                            {' '}({((detectionResult.analysis.committedPoints / detectionResult.analysis.avgVelocity) * 100).toFixed(0)}% - Ngưỡng: {'<'}110%)
                          </>
                        ) : (
                          <>Không có dấu hiệu overcommit (Ngưỡng: {'<'}110%)</>
                        )}
                      </div>
                    </div>

                    {/* 2. Blocked Issues */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <div>
                        <strong className="text-custom-text-200">Blocked Issues:</strong>{' '}
                        {detectionResult.analysis?.totalIssuesCount !== undefined ? (
                          <>
                            {detectionResult.analysis.blockedIssuesCount || 0}/{detectionResult.analysis.totalIssuesCount} issues
                            {detectionResult.analysis.blockedIssuesCount && detectionResult.analysis.blockedIssuesCount > 0
                              ? ` (${((detectionResult.analysis.blockedIssuesCount / detectionResult.analysis.totalIssuesCount) * 100).toFixed(0)}%)`
                              : ''
                            }
                            {' '}(Ngưỡng: {'<'}20%)
                          </>
                        ) : (
                          <>Không có issues bị chặn (Ngưỡng: {'<'}20%)</>
                        )}
                      </div>
                    </div>

                    {/* 3. Zero Progress */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <div>
                        <strong className="text-custom-text-200">Zero Progress:</strong> Không có issues stuck (Ngưỡng: {'<'}3 ngày)
                      </div>
                    </div>

                    {/* 4. Missing Estimates */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <div>
                        <strong className="text-custom-text-200">Missing Estimates:</strong>{' '}
                        {detectionResult.analysis?.missingEstimatesCount !== undefined && detectionResult.analysis?.totalIssuesCount ? (
                          <>
                            {detectionResult.analysis.missingEstimatesCount}/{detectionResult.analysis.totalIssuesCount} issues thiếu estimate
                            {detectionResult.analysis.missingEstimatesCount > 0
                              ? ` (${((detectionResult.analysis.missingEstimatesCount / detectionResult.analysis.totalIssuesCount) * 100).toFixed(0)}%)`
                              : ''
                            }
                            {' '}(Ngưỡng: {'<'}20%)
                          </>
                        ) : (
                          <>Đã estimate đầy đủ (Ngưỡng: {'<'}20%)</>
                        )}
                      </div>
                    </div>

                    {/* 5. Workload Imbalance */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <div className="flex-1">
                        <strong className="text-custom-text-200">Workload Imbalance:</strong>{' '}
                        {detectionResult.analysis?.workloadDistribution && detectionResult.analysis.workloadDistribution.length > 0 ? (
                          <>
                            <div className="mt-1 space-y-0.5">
                              {detectionResult.analysis.workloadDistribution.map((member, idx) => (
                                <div key={member.memberId} className="text-custom-text-400 text-xs">
                                  Member {idx + 1}: {member.points} points ({member.percentage}%)
                                  {member.percentage > 50 && <span className="text-red-500 ml-1">⚠️ Vượt ngưỡng</span>}
                                </div>
                              ))}
                            </div>
                            <div className="text-custom-text-400 mt-0.5">
                              → Ngưỡng: {'<'}50% cho 1 member
                            </div>
                          </>
                        ) : (
                          <>Phân bổ đều (Ngưỡng: {'<'}50% cho 1 member)</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Summary - Simplified to one line */}
          {detectionResult && detectionResult.risksFound > 0 && detectionResult.analysis && (
            <div className="p-3 rounded-lg border border-custom-border-200 bg-custom-background-90">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  {detectionResult.analysis.avgVelocity !== undefined && detectionResult.analysis.committedPoints !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-custom-text-400">Capacity:</span>
                      <span className={`font-medium ${
                        detectionResult.analysis.capacityStatus === 'OVER'
                          ? 'text-red-600 dark:text-red-400'
                          : detectionResult.analysis.capacityStatus === 'UNDER'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-green-600 dark:text-green-400'
                      }`}>
                        {detectionResult.analysis.committedPoints.toFixed(0)}/{detectionResult.analysis.avgVelocity.toFixed(0)} points
                        {detectionResult.analysis.capacityStatus === 'OVER' && ` (⚠️ +${((detectionResult.analysis.committedPoints / detectionResult.analysis.avgVelocity - 1) * 100).toFixed(0)}%)`}
                      </span>
                    </div>
                  )}
                  {detectionResult.analysis.blockedIssuesCount !== undefined && detectionResult.analysis.blockedIssuesCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-custom-text-400">Blocked:</span>
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">
                        {detectionResult.analysis.blockedIssuesCount} issues
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-custom-text-400">
                  {detectionResult.timestamp.toLocaleTimeString("vi-VN")}
                </span>
              </div>
            </div>
          )}

          {/* Detecting Progress */}
          {detecting && (
            <div className="p-6 rounded-lg border border-custom-border-200 bg-custom-background-90">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="size-5 text-custom-primary animate-spin" />
                <h4 className="text-sm font-semibold text-custom-text-100">
                  Đang phân tích sprint...
                </h4>
              </div>
              <div className="text-xs text-custom-text-300 space-y-1 ml-8">
                <p>⏳ Kiểm tra overcommitment và capacity...</p>
                <p>⏳ Phân tích dependencies giữa các issues...</p>
                <p>⏳ Xác định blocked issues...</p>
                <p>⏳ Đánh giá sprint timeline...</p>
              </div>
            </div>
          )}

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
      {!loading && !error && !detecting && (
        <div className="space-y-3">
          {risks.length === 0 ? (
            <div className="p-10 text-center border border-custom-border-200 rounded-lg bg-custom-background-100">
              <div className={`inline-flex p-4 rounded-full mb-4 ${
                detectionResult ? 'bg-green-500/10' : 'bg-custom-background-80'
              }`}>
                <Shield className={`size-10 ${
                  detectionResult ? 'text-green-500' : 'text-custom-text-300'
                }`} />
              </div>

              {detectionResult ? (
                <p className="text-base font-semibold text-green-600 dark:text-green-400">
                  Sprint đang trong tình trạng tốt!
                </p>
              ) : (
                <>
                  <p className="text-base font-semibold text-custom-text-100 mb-2">
                    Chưa có phân tích rủi ro
                  </p>
                  <p className="text-sm text-custom-text-300 mb-6 max-w-md mx-auto">
                    Phân tích sprint để phát hiện sớm các vấn đề về capacity, blocked issues,
                    và dependencies.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={detectRisks}
                  >
                    <AlertTriangle className="size-4 mr-2" />
                    Phân tích Sprint Ngay
                  </Button>
                </>
              )}
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
