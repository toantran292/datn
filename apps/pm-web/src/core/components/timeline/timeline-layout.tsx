"use client";

import { useState, useMemo, useEffect } from "react";
import { observer } from "mobx-react";
import { useIssue } from "@/core/hooks/store/use-issue";
import { TimelineChart } from "./timeline-chart";

interface TimelineLayoutProps {
  projectId: string;
  workspaceSlug: string;
  projectIdentifier?: string | null;
}

export const TimelineLayout = observer(({ projectId, workspaceSlug, projectIdentifier }: TimelineLayoutProps) => {
  const issueStore = useIssue();

  // Fetch issues when component mounts
  useEffect(() => {
    const loader = issueStore.getLoaderForProject(projectId);
    if (!loader) {
      issueStore.fetchIssuesByProject(projectId);
    }
  }, [projectId, issueStore]);

  // Get all issues for the project
  const issues = issueStore.getIssuesForProject(projectId) || [];

  // Filter issues that have both start and target dates
  const timelineIssues = useMemo(() => {
    return issues.filter((issue) => issue.startDate && issue.targetDate);
  }, [issues]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100">
      <TimelineChart
        issues={timelineIssues}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
        projectIdentifier={projectIdentifier}
      />
    </div>
  );
});
