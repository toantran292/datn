"use client";

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { cn } from "@uts/fe-utils";
import type { IIssue } from "@/core/types/issue";
import { CalendarQuickAddIssue } from "./calendar-quick-add-issue";
import { CalendarIssueBlock } from "./calendar-issue-block";

interface CalendarDayTileProps {
  date: Date;
  issues: IIssue[];
  isCurrentMonth: boolean;
  isToday: boolean;
  projectId: string;
  onIssueDrop?: (issueId: string, sourceDate: string | null, targetDate: string) => void;
}

export const CalendarDayTile = ({
  date,
  issues,
  isCurrentMonth,
  isToday,
  projectId,
  onIssueDrop,
}: CalendarDayTileProps) => {
  const dayTileRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const dayNumber = date.getDate();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  // Format date as YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0];

  // Setup drop target
  useEffect(() => {
    const element = dayTileRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ date: formattedDate }),
        onDragEnter: () => {
          setIsDraggingOver(true);
        },
        onDragLeave: () => {
          setIsDraggingOver(false);
        },
        onDrop: ({ source }) => {
          setIsDraggingOver(false);
          const sourceData = source?.data as { id: string; date: string | null } | undefined;
          if (!sourceData) return;

          onIssueDrop?.(sourceData.id, sourceData.date, formattedDate);
        },
      })
    );
  }, [formattedDate, onIssueDrop]);

  return (
    <div
      ref={dayTileRef}
      className={cn(
        "group relative flex min-h-[120px] flex-col border-b border-r border-custom-border-200 p-2 transition-colors",
        !isCurrentMonth && "bg-custom-background-90",
        isWeekend && "bg-custom-background-80",
        isToday && "bg-custom-primary-100/5",
        isDraggingOver && "bg-custom-primary-100/10 border-custom-primary-200"
      )}
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
          <CalendarIssueBlock key={issue.id} issue={issue} projectId={projectId} />
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
