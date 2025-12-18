"use client";

import { useState, FormEvent } from "react";
import { observer } from "mobx-react";
import { Plus, X } from "lucide-react";
import { cn } from "@uts/fe-utils";
import { Button } from "@uts/design-system/ui";
import { useIssue } from "@/core/hooks/store/use-issue";

interface CalendarQuickAddIssueProps {
  projectId: string;
  targetDate: string; // YYYY-MM-DD format
  onIssueCreated?: () => void;
}

export const CalendarQuickAddIssue = observer(({ projectId, targetDate, onIssueCreated }: CalendarQuickAddIssueProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [issueName, setIssueName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const issueStore = useIssue();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!issueName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await issueStore.createIssue({
        projectId,
        name: issueName.trim(),
        targetDate: targetDate,
        priority: "MEDIUM",
        type: "TASK",
        assignees: [],
      });
      setIssueName("");
      setIsOpen(false);
      onIssueCreated?.();
    } catch (error) {
      console.error("Failed to create issue:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setIssueName("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-300 transition-colors",
          "opacity-0 group-hover:opacity-100"
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Thêm công việc</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-1">
      <input
        type="text"
        value={issueName}
        onChange={(e) => setIssueName(e.target.value)}
        placeholder="Tên công việc..."
        autoFocus
        disabled={isCreating}
        className="flex-1 rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1.5 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 focus:outline-none disabled:opacity-50"
      />
      <div className="flex items-center gap-1">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!issueName.trim() || isCreating}
          className="h-7 px-2"
        >
          {isCreating ? "Đang tạo..." : "Thêm"}
        </Button>
        <Button
          type="button"
          variant="neutral-primary"
          size="sm"
          onClick={handleCancel}
          disabled={isCreating}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
});
