"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@uts/design-system/ui";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarHeader = ({ currentDate, onPrevious, onNext, onToday }: CalendarHeaderProps) => {
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
        </div>
      </div>

      <Button variant="neutral-primary" size="sm" onClick={onToday}>
        Hôm nay
      </Button>
    </div>
  );
};
