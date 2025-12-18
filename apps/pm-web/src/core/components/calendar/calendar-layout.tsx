"use client";

import { useState, useMemo, useEffect } from "react";
import { observer } from "mobx-react";
import { useIssue } from "@/core/hooks/store/use-issue";
import { CalendarGrid } from "./calendar-grid";
import { CalendarHeader, type CalendarLayout as CalendarLayoutType } from "./calendar-header";

interface CalendarLayoutProps {
  projectId: string;
}

export const CalendarLayout = observer(({ projectId }: CalendarLayoutProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [layout, setLayout] = useState<CalendarLayoutType>("month");
  const [showWeekends, setShowWeekends] = useState(true);
  const issueStore = useIssue();

  // Fetch issues when component mounts or projectId changes
  useEffect(() => {
    const loader = issueStore.getLoaderForProject(projectId);
    // Only fetch if not already loading or loaded
    if (!loader) {
      issueStore.fetchIssuesByProject(projectId);
    }
  }, [projectId, issueStore]);

  // Get all issues for the project - let MobX handle reactivity, don't use useMemo
  const issues = issueStore.getIssuesForProject(projectId) || [];

  // Group issues by target date
  const issuesByDate = useMemo(() => {
    const grouped: Record<string, typeof issues> = {};

    issues.forEach((issue) => {
      if (issue.targetDate) {
        const dateKey = issue.targetDate.split('T')[0]; // YYYY-MM-DD format
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(issue);
      }
    });

    return grouped;
  }, [issues]);

  const goToPrevious = () => {
    if (layout === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      // Go to previous week
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const goToNext = () => {
    if (layout === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      // Go to next week
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleIssueDrop = async (issueId: string, sourceDate: string | null, targetDate: string) => {
    // Don't update if dropping on the same date
    if (sourceDate === targetDate) return;

    try {
      await issueStore.updateIssue(issueId, {
        targetDate: targetDate,
      });
    } catch (error) {
      console.error("Failed to update issue target date:", error);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CalendarHeader
        currentDate={currentDate}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToday={goToToday}
        layout={layout}
        onLayoutChange={setLayout}
        showWeekends={showWeekends}
        onShowWeekendsChange={setShowWeekends}
      />

      <div className="flex-1 overflow-auto">
        <CalendarGrid
          currentDate={currentDate}
          issuesByDate={issuesByDate}
          projectId={projectId}
          onIssueDrop={handleIssueDrop}
          layout={layout}
          showWeekends={showWeekends}
        />
      </div>
    </div>
  );
});
