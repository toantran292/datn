"use client";

import { useState, useMemo, useEffect } from "react";
import { observer } from "mobx-react";
import { useIssue } from "@/core/hooks/store/use-issue";
import { CalendarGrid } from "./calendar-grid";
import { CalendarHeader } from "./calendar-header";

interface CalendarLayoutProps {
  projectId: string;
}

export const CalendarLayout = observer(({ projectId }: CalendarLayoutProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
        onToday={goToToday}
      />

      <div className="flex-1 overflow-auto">
        <CalendarGrid
          currentDate={currentDate}
          issuesByDate={issuesByDate}
          projectId={projectId}
          onIssueDrop={handleIssueDrop}
        />
      </div>
    </div>
  );
});
