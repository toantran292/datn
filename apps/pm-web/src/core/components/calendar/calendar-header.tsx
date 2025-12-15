"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";

export type CalendarLayout = "month" | "week";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  layout: CalendarLayout;
  onLayoutChange: (layout: CalendarLayout) => void;
  showWeekends: boolean;
  onShowWeekendsChange: (show: boolean) => void;
}

export const CalendarHeader = ({
  currentDate,
  onPrevious,
  onNext,
  onToday,
  layout,
  onLayoutChange,
  showWeekends,
  onShowWeekendsChange,
}: CalendarHeaderProps) => {
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  return (
    <div className="flex items-center justify-between border-b border-custom-border-200 pb-4">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-custom-text-100">
          {currentMonth} {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={onPrevious}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={onNext}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="neutral-primary" size="sm" onClick={onToday}>
            Hôm nay
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Layout toggle */}
        <div className="flex items-center gap-1 rounded-md border border-custom-border-200 p-1">
          <Button
            variant={layout === "month" ? "primary" : "neutral-primary"}
            size="sm"
            onClick={() => onLayoutChange("month")}
            className={cn("h-6 px-3 text-xs", layout === "month" && "bg-custom-primary-100 text-white")}
          >
            Tháng
          </Button>
          <Button
            variant={layout === "week" ? "primary" : "neutral-primary"}
            size="sm"
            onClick={() => onLayoutChange("week")}
            className={cn("h-6 px-3 text-xs", layout === "week" && "bg-custom-primary-100 text-white")}
          >
            Tuần
          </Button>
        </div>

        {/* Show weekends toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showWeekends}
            onChange={(e) => onShowWeekendsChange(e.target.checked)}
            className="h-4 w-4 rounded border-custom-border-300 text-custom-primary-100 focus:ring-custom-primary-100"
          />
          <span className="text-xs text-custom-text-300">Hiện cuối tuần</span>
        </label>
      </div>
    </div>
  );
};
