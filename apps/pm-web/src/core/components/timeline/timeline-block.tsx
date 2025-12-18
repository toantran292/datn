"use client";

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { cn } from "@uts/fe-utils";
import type { IIssue } from "@/core/types/issue";

interface TimelineBlockProps {
  issue: IIssue;
  projectId: string;
  workspaceSlug: string;
  marginLeft: number;
  width: number;
  dayWidth: number;
  onResize: (issueId: string, newStartDate: string, newTargetDate: string) => void;
  onMove: (issueId: string, newStartDate: string, newTargetDate: string) => void;
  onClick: (issueId: string) => void;
}

const BLOCK_HEIGHT = 40;

export const TimelineBlock = observer(({
  issue,
  projectId,
  workspaceSlug,
  marginLeft,
  width,
  dayWidth,
  onResize,
  onMove,
  onClick,
}: TimelineBlockProps) => {
  const blockRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<"left" | "right" | "move" | null>(null);
  const dragStartRef = useRef({ mouseX: 0, marginLeft: 0, width: 0 });
  const hasDraggedRef = useRef(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-blue-500";
      case "LOW":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const handleMouseDown = (e: React.MouseEvent, direction: "left" | "right" | "move") => {
    e.stopPropagation();
    if (e.button !== 0) return;

    setIsDragging(direction);
    hasDraggedRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      marginLeft,
      width,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!blockRef.current) return;

      const deltaX = moveEvent.clientX - dragStartRef.current.mouseX;

      // If mouse moved more than 3px, consider it a drag
      if (Math.abs(deltaX) > 3) {
        hasDraggedRef.current = true;
      }

      const deltaDays = Math.round(deltaX / dayWidth);

      let newMarginLeft = dragStartRef.current.marginLeft;
      let newWidth = dragStartRef.current.width;

      if (direction === "left") {
        // Resize from left
        newMarginLeft = dragStartRef.current.marginLeft + deltaDays * dayWidth;
        newWidth = dragStartRef.current.width - deltaDays * dayWidth;
      } else if (direction === "right") {
        // Resize from right
        newWidth = dragStartRef.current.width + deltaDays * dayWidth;
      } else if (direction === "move") {
        // Move entire block
        newMarginLeft = dragStartRef.current.marginLeft + deltaDays * dayWidth;
      }

      // Minimum width is 1 day
      if (newWidth < dayWidth) return;

      blockRef.current.style.marginLeft = `${newMarginLeft}px`;
      blockRef.current.style.width = `${newWidth}px`;
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      if (!blockRef.current || !issue.startDate || !issue.targetDate) return;

      const newMarginLeft = parseFloat(blockRef.current.style.marginLeft);
      const newWidth = parseFloat(blockRef.current.style.width);

      const startDaysDiff = Math.round((newMarginLeft - marginLeft) / dayWidth);
      const widthDaysDiff = Math.round((newWidth - width) / dayWidth);

      const startDate = new Date(issue.startDate);
      const targetDate = new Date(issue.targetDate);

      if (direction === "left" && startDaysDiff !== 0) {
        startDate.setDate(startDate.getDate() + startDaysDiff);
        onResize(issue.id, startDate.toISOString(), targetDate.toISOString());
      } else if (direction === "right" && widthDaysDiff !== 0) {
        targetDate.setDate(targetDate.getDate() + widthDaysDiff);
        onResize(issue.id, startDate.toISOString(), targetDate.toISOString());
      } else if (direction === "move" && startDaysDiff !== 0) {
        startDate.setDate(startDate.getDate() + startDaysDiff);
        targetDate.setDate(targetDate.getDate() + startDaysDiff);
        onMove(issue.id, startDate.toISOString(), targetDate.toISOString());
      }

      // Reset hasDragged after a short delay to prevent onClick from firing
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 100);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't open panel if user just finished dragging
    if (isDragging || hasDraggedRef.current) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    onClick(issue.id);
  };

  return (
    <div
      ref={blockRef}
      className={cn(
        "absolute flex items-center rounded shadow-sm transition-all group cursor-pointer",
        getPriorityColor(issue.priority),
        isDragging && "opacity-70 shadow-lg z-10"
      )}
      style={{
        marginLeft: `${marginLeft}px`,
        width: `${Math.max(width, dayWidth)}px`,
        height: `${BLOCK_HEIGHT - 8}px`,
        top: "4px",
      }}
      onClick={handleClick}
    >
      {/* Left resize handle */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity",
          isDragging === "left" && "opacity-100 bg-white/30"
        )}
        onMouseDown={(e) => handleMouseDown(e, "left")}
      />

      {/* Content */}
      <div
        className="flex-1 px-2 text-xs font-medium text-white truncate select-none"
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        {issue.name}
      </div>

      {/* Right resize handle */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity",
          isDragging === "right" && "opacity-100 bg-white/30"
        )}
        onMouseDown={(e) => handleMouseDown(e, "right")}
      />
    </div>
  );
});
