"use client";

import { useMemo } from "react";
import { CalendarDayTile } from "./calendar-day-tile";
import type { IIssue } from "@/core/types/issue";
import type { CalendarLayout } from "./calendar-header";

interface CalendarGridProps {
  currentDate: Date;
  issuesByDate: Record<string, IIssue[]>;
  projectId: string;
  onIssueDrop?: (issueId: string, sourceDate: string | null, targetDate: string) => void;
  layout: CalendarLayout;
  showWeekends: boolean;
}

export const CalendarGrid = ({
  currentDate,
  issuesByDate,
  projectId,
  onIssueDrop,
  layout,
  showWeekends
}: CalendarGridProps) => {
  const allDayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const weekdayNames = ["T2", "T3", "T4", "T5", "T6"];

  // Calculate visible day names based on showWeekends
  const visibleDayNames = showWeekends ? allDayNames : weekdayNames;

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    if (layout === "week") {
      // Week layout: show 7 days of the current week starting from Monday
      const days: Date[] = [];
      const current = new Date(currentDate);

      // Find Monday of the current week
      const dayOfWeek = current.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
      current.setDate(current.getDate() - daysToSubtract);

      // Generate 7 days
      for (let i = 0; i < 7; i++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      return days;
    } else {
      // Month layout: show full month view (6 weeks)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // First day of the month
      const firstDay = new Date(year, month, 1);

      // Start from Monday before the first day
      const startDay = new Date(firstDay);
      const dayOfWeek = firstDay.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
      startDay.setDate(firstDay.getDate() - daysToSubtract);

      // Generate 6 weeks of days (42 days total)
      const days: Date[] = [];
      const current = new Date(startDay);

      for (let i = 0; i < 42; i++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      return days;
    }
  }, [currentDate, layout]);

  // Filter out weekends if showWeekends is false
  const visibleDays = useMemo(() => {
    if (showWeekends) {
      return calendarDays;
    }
    // Filter out Saturday (6) and Sunday (0)
    return calendarDays.filter(day => {
      const dayOfWeek = day.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    });
  }, [calendarDays, showWeekends]);

  // Calculate grid columns based on visible days
  const gridCols = showWeekends ? 7 : 5;
  const gridClass = showWeekends ? "grid-cols-7" : "grid-cols-5";
  const rowsClass = layout === "week" ? "grid-rows-1" : "grid-rows-6";

  return (
    <div className="flex flex-col h-full">
      {/* Day names header */}
      <div className={`grid ${gridClass} border-b border-custom-border-200 bg-custom-background-90`}>
        {visibleDayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-custom-text-300"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={`grid flex-1 ${gridClass} ${rowsClass} bg-custom-background-100`}>
        {visibleDays.map((day, index) => {
          const dateKey = day.toISOString().split('T')[0];
          const dayIssues = issuesByDate[dateKey] || [];
          const isCurrentMonth = layout === "week" ? true : day.getMonth() === currentDate.getMonth();
          const isToday = new Date().toDateString() === day.toDateString();

          return (
            <CalendarDayTile
              key={index}
              date={day}
              issues={dayIssues}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              projectId={projectId}
              onIssueDrop={onIssueDrop}
            />
          );
        })}
      </div>
    </div>
  );
};
