"use client";

import { useState, useMemo } from "react";
import { observer } from "mobx-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { useIssue } from "@/core/hooks/store/use-issue";
import { CalendarGrid } from "./calendar-grid";
import { CalendarHeader } from "./calendar-header";

interface CalendarLayoutProps {
  projectId: string;
}

export const CalendarLayout = observer(({ projectId }: CalendarLayoutProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const issueStore = useIssue();

  // Get all issues for the project
  const issues = useMemo(() => {
    return issueStore.getIssuesForProject(projectId) || [];
  }, [issueStore, projectId]);

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
        />
      </div>
    </div>
  );
});
