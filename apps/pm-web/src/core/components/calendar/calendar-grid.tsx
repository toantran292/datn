"use client";

import { useMemo } from "react";
import { CalendarDayTile } from "./calendar-day-tile";
import type { IIssue } from "@/core/types/issue";

interface CalendarGridProps {
  currentDate: Date;
  issuesByDate: Record<string, IIssue[]>;
  projectId: string;
  onIssueDrop?: (issueId: string, sourceDate: string | null, targetDate: string) => void;
}

export const CalendarGrid = ({ currentDate, issuesByDate, projectId, onIssueDrop }: CalendarGridProps) => {
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

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
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full">
      {/* Day names header */}
      <div className="grid grid-cols-7 border-b border-custom-border-200 bg-custom-background-90">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-custom-text-300"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6 bg-custom-background-100">
        {calendarDays.map((day, index) => {
          const dateKey = day.toISOString().split('T')[0];
          const dayIssues = issuesByDate[dateKey] || [];
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
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
