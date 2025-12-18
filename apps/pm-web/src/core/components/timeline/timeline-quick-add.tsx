"use client";

import { useState, FormEvent } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { cn } from "@uts/fe-utils";
import { useIssue } from "@/core/hooks/store/use-issue";

interface TimelineQuickAddProps {
  projectId: string;
}

export const TimelineQuickAdd = observer(({ projectId }: TimelineQuickAddProps) => {
  const issueStore = useIssue();
  const [isOpen, setIsOpen] = useState(false);
  const [issueName, setIssueName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!issueName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      // Default: startDate = today, targetDate = tomorrow
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await issueStore.createIssue({
        projectId,
        name: issueName.trim(),
        startDate: today.toISOString(),
        targetDate: tomorrow.toISOString(),
        priority: "MEDIUM",
        type: "TASK",
        assignees: [],
      });
      setIssueName("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create issue:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="sticky bottom-0 z-10 border-t border-custom-border-200 bg-custom-background-100 p-2">
        <button
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-200"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm công việc</span>
        </button>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 z-10 border-t border-custom-border-200 bg-custom-background-100 p-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={issueName}
          onChange={(e) => setIssueName(e.target.value)}
          placeholder="Tên công việc..."
          className="w-full rounded border border-custom-border-300 bg-custom-background-100 px-2 py-1.5 text-sm text-custom-text-100 placeholder-custom-text-400 focus:border-custom-primary-100 focus:outline-none"
          autoFocus
          disabled={isCreating}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!issueName.trim() || isCreating}
            className={cn(
              "rounded bg-custom-primary-100 px-3 py-1.5 text-xs font-medium text-white transition-opacity",
              (!issueName.trim() || isCreating) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isCreating ? "Đang tạo..." : "Tạo"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIssueName("");
            }}
            className="rounded px-3 py-1.5 text-xs font-medium text-custom-text-300 hover:bg-custom-background-90"
            disabled={isCreating}
          >
            Hủy
          </button>
          <span className="text-xs text-custom-text-400">
            (Ngày bắt đầu: hôm nay, Ngày kết thúc: ngày mai)
          </span>
        </div>
      </form>
    </div>
  );
});
