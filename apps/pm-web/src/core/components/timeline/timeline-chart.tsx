"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@uts/fe-utils";
import { Button } from "@uts/design-system/ui";
import type { IIssue } from "@/core/types/issue";
import { useIssue } from "@/core/hooks/store/use-issue";
import { TimelineBlock } from "./timeline-block";
import { TimelineQuickAdd } from "./timeline-quick-add";

const IssueDetailPanel = dynamic(
  () => import("@/core/components/issue/issue-detail-panel").then((mod) => mod.IssueDetailPanel),
  { ssr: false }
);

interface TimelineChartProps {
  issues: IIssue[];
  projectId: string;
  workspaceSlug: string;
  projectIdentifier?: string | null;
}

type ViewMode = "week" | "month";

const BLOCK_HEIGHT = 40;
const SIDEBAR_WIDTH = 360;
const DAY_WIDTH = {
  week: 50,
  month: 20,
};
const DETAIL_PANEL_MIN_WIDTH = 360;
const DETAIL_PANEL_MAX_WIDTH = 720;
const DETAIL_PANEL_DEFAULT_WIDTH = 440;

export const TimelineChart = observer(({ issues, projectId, workspaceSlug, projectIdentifier }: TimelineChartProps) => {
  const issueStore = useIssue();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentMonthStart, setCurrentMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [detailWidth, setDetailWidth] = useState<number>(DETAIL_PANEL_DEFAULT_WIDTH);
  const [isResizingDetail, setIsResizingDetail] = useState(false);
  const detailResizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const dayWidth = DAY_WIDTH[viewMode];

  // Calculate visible date range (3 months)
  const { startDate, endDate, totalDays, months } = useMemo(() => {
    const start = new Date(currentMonthStart);
    const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Generate month info
    const monthsInfo: Array<{ month: string; year: number; days: number; startDay: number }> = [];
    const current = new Date(start);

    while (current <= end) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const daysInMonth = monthEnd.getDate();
      const startDay = Math.floor((monthStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      monthsInfo.push({
        month: current.toLocaleDateString("vi-VN", { month: "short" }),
        year: current.getFullYear(),
        days: daysInMonth,
        startDay,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return {
      startDate: start,
      endDate: end,
      totalDays: days,
      months: monthsInfo,
    };
  }, [currentMonthStart]);

  // Calculate issue blocks with position
  const issueBlocks = useMemo(() => {
    return issues
      .map((issue) => {
        if (!issue.startDate || !issue.targetDate) return null;

        const start = new Date(issue.startDate);
        const end = new Date(issue.targetDate);

        // Only show issues within visible range
        if (end < startDate || start > endDate) return null;

        const displayStart = start < startDate ? startDate : start;
        const displayEnd = end > endDate ? endDate : end;

        const daysFromStart = Math.floor((displayStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((displayEnd.getTime() - displayStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return {
          issue,
          marginLeft: daysFromStart * dayWidth,
          width: duration * dayWidth,
        };
      })
      .filter(Boolean) as Array<{ issue: IIssue; marginLeft: number; width: number }>;
  }, [issues, startDate, endDate, dayWidth]);

  const selectedIssue = useMemo(() => {
    return selectedIssueId ? issues.find(i => i.id === selectedIssueId) ?? null : null;
  }, [selectedIssueId, issues]);

  const goToPrevMonth = () => {
    setCurrentMonthStart(new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonthStart(new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonthStart(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const handleBlockResize = useCallback(
    async (issueId: string, newStartDate: string, newTargetDate: string) => {
      try {
        await issueStore.updateIssue(issueId, {
          startDate: newStartDate,
          targetDate: newTargetDate,
        });
      } catch (error) {
        console.error("Failed to resize block:", error);
      }
    },
    [issueStore]
  );

  const handleBlockMove = useCallback(
    async (issueId: string, newStartDate: string, newTargetDate: string) => {
      try {
        await issueStore.updateIssue(issueId, {
          startDate: newStartDate,
          targetDate: newTargetDate,
        });
      } catch (error) {
        console.error("Failed to move block:", error);
      }
    },
    [issueStore]
  );

  const handleIssueClick = useCallback((issueId: string) => {
    setSelectedIssueId(issueId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedIssueId(null);
  }, []);

  const handleDetailResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingDetail(true);
    detailResizeStateRef.current = {
      startX: e.clientX,
      startWidth: detailWidth,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!detailResizeStateRef.current) return;
      const delta = detailResizeStateRef.current.startX - moveEvent.clientX;
      const newWidth = Math.max(
        DETAIL_PANEL_MIN_WIDTH,
        Math.min(DETAIL_PANEL_MAX_WIDTH, detailResizeStateRef.current.startWidth + delta)
      );
      setDetailWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingDetail(false);
      detailResizeStateRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [detailWidth]);

  if (issues.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-custom-text-300">
            Không có công việc nào có ngày bắt đầu và ngày kết thúc.
          </p>
          <p className="mt-2 text-xs text-custom-text-400">
            Thêm ngày bắt đầu và ngày kết thúc cho công việc để hiển thị trên timeline.
          </p>
        </div>
      </div>
    );
  }

  const chartWidth = totalDays * dayWidth;

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-custom-border-200 bg-custom-background-90 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Button variant="neutral-primary" size="sm" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="neutral-primary" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="neutral-primary" size="sm" onClick={goToToday}>
              Hôm nay
            </Button>
            <span className="text-sm font-medium text-custom-text-200">
              {currentMonthStart.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "week" ? "primary" : "neutral-primary"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Tuần
            </Button>
            <Button
              variant={viewMode === "month" ? "primary" : "neutral-primary"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Tháng
            </Button>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div
            className="flex-shrink-0 overflow-y-auto border-r border-custom-border-200 bg-custom-background-100"
            style={{ width: SIDEBAR_WIDTH }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-20 border-b border-custom-border-200 bg-custom-background-90 px-4 py-2"
              style={{ height: 80 }}
            >
              <p className="text-xs font-medium text-custom-text-400">CÔNG VIỆC</p>
            </div>

            {/* Issue List */}
            <div>
              {issueBlocks.map(({ issue }) => (
                <div
                  key={issue.id}
                  className="flex items-center border-b border-custom-border-100 px-4 py-2 hover:bg-custom-background-80"
                  style={{ height: BLOCK_HEIGHT }}
                >
                  <button
                    onClick={() => handleIssueClick(issue.id)}
                    className="flex-1 truncate text-left text-sm text-custom-text-200 hover:text-custom-primary-100"
                  >
                    <span className="font-medium">{issue.name}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add */}
            <TimelineQuickAdd projectId={projectId} />
          </div>

          {/* Right Timeline */}
          <div className="flex-1 overflow-auto">
            <div style={{ minWidth: chartWidth }}>
              {/* Month Headers */}
              <div
                className="sticky top-0 z-10 flex border-b-2 border-custom-border-300 bg-custom-background-90"
                style={{ height: 40 }}
              >
                {months.map((month, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center border-r border-custom-border-200 text-xs font-semibold uppercase text-custom-text-300"
                    style={{ width: month.days * dayWidth }}
                  >
                    {month.month} {month.year}
                  </div>
                ))}
              </div>

              {/* Day Headers */}
              <div className="sticky top-10 z-10 flex border-b border-custom-border-200 bg-custom-background-90" style={{ height: 40 }}>
                {Array.from({ length: totalDays }).map((_, dayIndex) => {
                  const currentDate = new Date(startDate);
                  currentDate.setDate(startDate.getDate() + dayIndex);
                  const dayNum = currentDate.getDate();

                  return (
                    <div
                      key={dayIndex}
                      className="flex flex-shrink-0 items-center justify-center border-r border-custom-border-100 text-xs text-custom-text-400"
                      style={{ width: dayWidth }}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>

              {/* Timeline Grid & Blocks */}
              <div className="relative">
                {/* Vertical Grid Lines */}
                <div className="pointer-events-none absolute inset-0 flex">
                  {Array.from({ length: totalDays }).map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="flex-shrink-0 border-r border-custom-border-100"
                      style={{ width: dayWidth }}
                    />
                  ))}
                </div>

                {/* Issue Blocks */}
                {issueBlocks.map(({ issue, marginLeft, width }) => (
                  <div
                    key={issue.id}
                    className="relative border-b border-custom-border-100"
                    style={{ height: BLOCK_HEIGHT }}
                  >
                    <TimelineBlock
                      issue={issue}
                      projectId={projectId}
                      workspaceSlug={workspaceSlug}
                      marginLeft={marginLeft}
                      width={width}
                      dayWidth={dayWidth}
                      onResize={handleBlockResize}
                      onMove={handleBlockMove}
                      onClick={handleIssueClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Detail Panel */}
      {selectedIssue ? (
        <div
          className="fixed right-0 top-[50px] z-30 flex h-[calc(100vh-50px)] border-l border-custom-border-200 bg-custom-background-100 shadow-xl"
          style={{ width: detailWidth }}
        >
          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={handleDetailResizeStart}
            className={cn(
              "absolute left-0 top-0 h-full w-1.5 -translate-x-1/2 cursor-col-resize transition-colors",
              isResizingDetail ? "bg-custom-primary-100" : "bg-transparent hover:bg-custom-primary-100/40"
            )}
          >
            <span className="sr-only">Điều chỉnh chiều rộng chi tiết công việc</span>
          </div>
          <div className="flex-1">
            <IssueDetailPanel
              issue={selectedIssue}
              projectIdentifier={projectIdentifier}
              locationLabel="Timeline"
              workspaceSlug={workspaceSlug}
              onClose={handleCloseDetail}
              onUpdateIssue={async (issueId, data) => {
                await issueStore.updateIssue(issueId, data);
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
});
