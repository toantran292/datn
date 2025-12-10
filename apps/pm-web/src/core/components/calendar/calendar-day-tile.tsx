"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@uts/fe-utils";
import { Badge } from "@uts/design-system/ui";
import type { IIssue } from "@/core/types/issue";
import { ISSUE_PRIORITY_BADGE_VARIANT } from "@/core/components/backlog/utils";
import { CalendarQuickAddIssue } from "./calendar-quick-add-issue";

interface CalendarDayTileProps {
  date: Date;
  issues: IIssue[];
  isCurrentMonth: boolean;
  isToday: boolean;
  projectId: string;
}

export const CalendarDayTile = ({
  date,
  issues,
  isCurrentMonth,
  isToday,
  projectId,
}: CalendarDayTileProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const dayNumber = date.getDate();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  const handleIssueClick = (issueId: string) => {
    // Navigate to issue detail
    const currentPath = window.location.pathname;
    const parts = currentPath.split('/');
    const workspaceSlug = parts[1];
    router.push(`/${workspaceSlug}/project/${projectId}/issue/${issueId}`);
  };

  // Format date as YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0];

  return (
    <div
      className={cn(
        "group relative flex min-h-[120px] flex-col border-b border-r border-custom-border-200 p-2",
        !isCurrentMonth && "bg-custom-background-90",
        isWeekend && "bg-custom-background-80",
        isToday && "bg-custom-primary-100/5"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Day number */}
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
            isToday
              ? "bg-custom-primary-100 text-white"
              : isCurrentMonth
              ? "text-custom-text-100"
              : "text-custom-text-400"
          )}
        >
          {dayNumber}
        </span>
      </div>

      {/* Issues list */}
      <div className="flex flex-col gap-1 overflow-auto">
        {issues.slice(0, 3).map((issue) => (
          <button
            key={issue.id}
            onClick={() => handleIssueClick(issue.id)}
            className={cn(
              "group flex items-center gap-1.5 rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-left text-xs transition-all hover:shadow-sm",
              "hover:border-custom-primary-200"
            )}
          >
            <Badge
              variant={ISSUE_PRIORITY_BADGE_VARIANT[issue.priority]}
              size="xs"
              className="flex-shrink-0"
            >
              {issue.priority.charAt(0)}
            </Badge>
            <span className="flex-1 truncate text-custom-text-200 group-hover:text-custom-text-100">
              {issue.name}
            </span>
          </button>
        ))}

        {issues.length > 3 && (
          <div className="mt-1 text-center text-xs text-custom-text-300">
            +{issues.length - 3} khác
          </div>
        )}

        {/* Quick add issue button */}
        <CalendarQuickAddIssue projectId={projectId} targetDate={formattedDate} />
      </div>
    </div>
  );
};
