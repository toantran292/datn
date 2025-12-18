"use client";

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useRouter } from "next/navigation";
import { cn } from "@uts/fe-utils";
import { Badge } from "@uts/design-system/ui";
import type { IIssue } from "@/core/types/issue";
import { ISSUE_PRIORITY_BADGE_VARIANT } from "@/core/components/backlog/utils";

interface CalendarIssueBlockProps {
  issue: IIssue;
  projectId: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const CalendarIssueBlock = ({
  issue,
  projectId,
  onDragStart,
  onDragEnd,
}: CalendarIssueBlockProps) => {
  const router = useRouter();
  const issueRef = useRef<HTMLButtonElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const element = issueRef.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        getInitialData: () => ({
          id: issue.id,
          date: issue.targetDate,
          projectId: issue.projectId,
        }),
        onDragStart: () => {
          setIsDragging(true);
          onDragStart?.();
        },
        onDrop: () => {
          setIsDragging(false);
          onDragEnd?.();
        },
      })
    );
  }, [issue.id, issue.targetDate, issue.projectId, onDragStart, onDragEnd]);

  const handleIssueClick = () => {
    const currentPath = window.location.pathname;
    const parts = currentPath.split('/');
    const workspaceSlug = parts[1];
    router.push(`/${workspaceSlug}/project/${projectId}/issue/${issue.id}`);
  };

  return (
    <button
      ref={issueRef}
      onClick={handleIssueClick}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-left text-xs transition-all hover:shadow-sm",
        "hover:border-custom-primary-200",
        isDragging && "opacity-50 cursor-grabbing"
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
  );
};
