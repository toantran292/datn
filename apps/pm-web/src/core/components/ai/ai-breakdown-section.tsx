"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, ListTree, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import type { BreakdownData, SubTask } from "@/core/types/ai";

export interface AIBreakdownSectionProps {
  breakdown: BreakdownData;
  onAccept: (subTasks: SubTask[]) => void;
  onCancel: () => void;
  isExpanded?: boolean;
  isCreating?: boolean;
}

const TASK_TYPE_COLORS: Record<string, string> = {
  FEATURE: "text-blue-600 bg-blue-50",
  TESTING: "text-green-600 bg-green-50",
  INFRA: "text-purple-600 bg-purple-50",
  DOCS: "text-gray-600 bg-gray-50",
  BUGFIX: "text-red-600 bg-red-50",
};

const TECHNICAL_LAYER_LABELS: Record<string, string> = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  DATABASE: "Database",
  DEVOPS: "DevOps",
  CROSS: "Cross-layer",
};

export const AIBreakdownSection: React.FC<AIBreakdownSectionProps> = ({
  breakdown,
  onAccept,
  onCancel,
  isExpanded = true,
  isCreating = false,
}) => {
  const [expanded, setExpanded] = useState(isExpanded);

  const getMetricColor = (value: number): string => {
    if (value >= 0.8) return "text-green-600";
    if (value >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="border border-custom-border-200 rounded-lg bg-custom-background-90 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-custom-primary-100/5 border-b border-custom-border-200">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-custom-primary-100/10 grid place-items-center">
            <Sparkles className="size-4 text-custom-primary-100" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-custom-text-100">AI Issue Breakdown</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-custom-text-300">
                {breakdown.subTasks.length} sub-tasks • {breakdown.validation.totalPoints} points
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
          {/* Summary & Metrics */}
          <div className="px-4 py-4 bg-custom-background-100 border-b border-custom-border-200">
            <p className="text-xs font-medium text-custom-text-200 uppercase tracking-wide mb-3">
              Tóm tắt
            </p>
            <p className="text-sm text-custom-text-300 mb-3">
              {breakdown.reasoning.summary}
            </p>

            <div className="grid grid-cols-4 gap-3">
              <div className="p-2.5 rounded-md bg-custom-background-90 border border-custom-border-200">
                <div className="text-xs text-custom-text-400 mb-1">Completeness</div>
                <div className={`text-lg font-semibold ${getMetricColor(breakdown.validation.completeness)}`}>
                  {Math.round(breakdown.validation.completeness * 100)}%
                </div>
              </div>
              <div className="p-2.5 rounded-md bg-custom-background-90 border border-custom-border-200">
                <div className="text-xs text-custom-text-400 mb-1">Balance</div>
                <div className={`text-lg font-semibold ${getMetricColor(breakdown.validation.balanceScore)}`}>
                  {Math.round(breakdown.validation.balanceScore * 100)}%
                </div>
              </div>
              <div className="p-2.5 rounded-md bg-custom-background-90 border border-custom-border-200">
                <div className="text-xs text-custom-text-400 mb-1">Coverage</div>
                <div className={`text-lg font-semibold ${getMetricColor(breakdown.validation.coveragePercentage / 100)}`}>
                  {breakdown.validation.coveragePercentage}%
                </div>
              </div>
              <div className="p-2.5 rounded-md bg-custom-background-90 border border-custom-border-200">
                <div className="text-xs text-custom-text-400 mb-1">Total Points</div>
                <div className="text-lg font-semibold text-custom-primary-100">
                  {breakdown.validation.totalPoints}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-tasks List */}
          <div className="px-4 py-3 bg-custom-background-100 border-b border-custom-border-200">
            <p className="text-xs font-medium text-custom-text-200 uppercase tracking-wide mb-3 flex items-center gap-2">
              <ListTree className="size-3.5" />
              Sub-tasks ({breakdown.subTasks.length})
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {breakdown.subTasks.map((task) => (
                <div
                  key={task.tempId}
                  className="p-3 rounded-md bg-custom-background-90 border border-custom-border-200 hover:bg-custom-background-80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-custom-text-400">
                          #{task.order}
                        </span>
                        <span className="text-sm font-medium text-custom-text-100">
                          {task.name}
                        </span>
                      </div>
                      <p className="text-xs text-custom-text-300 line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${TASK_TYPE_COLORS[task.taskType] || "text-gray-600 bg-gray-50"}`}>
                        {task.taskType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-custom-primary-100/10 text-custom-primary-100">
                        {task.estimatedPoints}pt
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-custom-text-400">
                    <span>{TECHNICAL_LAYER_LABELS[task.technicalLayer]}</span>
                    {task.dependencies.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Info className="size-3" />
                        Depends on: {task.dependencies.join(", ")}
                      </span>
                    )}
                    {task.canParallelize && (
                      <span className="text-green-600">⚡ Parallelizable</span>
                    )}
                  </div>

                  {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-custom-border-200">
                      <div className="text-xs font-medium text-custom-text-300 mb-1">
                        Acceptance Criteria:
                      </div>
                      <ul className="text-xs text-custom-text-400 space-y-0.5">
                        {task.acceptanceCriteria.slice(0, 3).map((ac, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <CheckCircle2 className="size-3 mt-0.5 flex-shrink-0 text-green-500" />
                            <span>{ac}</span>
                          </li>
                        ))}
                        {task.acceptanceCriteria.length > 3 && (
                          <li className="text-custom-text-400 ml-4">
                            +{task.acceptanceCriteria.length - 3} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coverage Analysis */}
          {breakdown.reasoning.coverageAreas.length > 0 && (
            <div className="px-4 py-3 bg-custom-background-100 border-b border-custom-border-200">
              <p className="text-xs font-medium text-custom-text-200 uppercase tracking-wide mb-2">
                Coverage Analysis
              </p>
              <div className="space-y-1.5">
                {breakdown.reasoning.coverageAreas.map((area, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-custom-background-90"
                  >
                    <div className="flex items-center gap-2">
                      {area.covered ? (
                        <CheckCircle2 className="size-4 text-green-500" />
                      ) : (
                        <AlertCircle className="size-4 text-yellow-500" />
                      )}
                      <span className="text-sm text-custom-text-200">{area.area}</span>
                      <span className="text-xs text-custom-text-400">
                        ({area.tasks.length} tasks)
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${getMetricColor(area.completeness)}`}>
                      {Math.round(area.completeness * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks & Assumptions */}
          {(breakdown.reasoning.risks.length > 0 || breakdown.reasoning.assumptions.length > 0) && (
            <div className="px-4 py-3 bg-custom-background-100 border-b border-custom-border-200">
              {breakdown.reasoning.assumptions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-custom-text-200 uppercase tracking-wide mb-2">
                    Giả định
                  </p>
                  <div className="space-y-1">
                    {breakdown.reasoning.assumptions.map((assumption, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-custom-text-300">
                        <Info className="size-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                        <span>{assumption}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {breakdown.reasoning.risks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-custom-text-200 uppercase tracking-wide mb-2">
                    Rủi ro
                  </p>
                  <div className="space-y-1">
                    {breakdown.reasoning.risks.map((risk, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-custom-text-300">
                        <AlertCircle className="size-3.5 mt-0.5 flex-shrink-0 text-yellow-500" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-4 py-3 bg-custom-background-100">
            <div className="text-xs text-custom-text-400">
              AI Breakdown • GPT-4o-mini
            </div>
            <div className="flex items-center gap-2">
              <Button variant="neutral-primary" size="sm" onClick={onCancel} disabled={isCreating}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAccept(breakdown.subTasks)}
                disabled={isCreating}
              >
                {isCreating ? "Đang tạo..." : `Tạo ${breakdown.subTasks.length} Sub-tasks`}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
