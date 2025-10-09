import type { BadgeProps } from "@uts/design-system/ui";

import { TIssuePriority, TIssueState, TIssueType } from "@/core/types/issue";

export const ISSUE_STATE_LABELS: Record<TIssueState, string> = {
  TODO: "Chưa bắt đầu",
  IN_PROGRESS: "Đang thực hiện",
  IN_REVIEW: "Đang review",
  DONE: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const ISSUE_PRIORITY_LABELS: Record<TIssuePriority, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  CRITICAL: "Khẩn cấp",
};

export const ISSUE_TYPE_LABELS: Record<TIssueType, string> = {
  STORY: "Story",
  TASK: "Task",
  BUG: "Bug",
  EPIC: "Epic",
};

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export const ISSUE_STATE_BADGE_VARIANT: Record<TIssueState, BadgeVariant> = {
  TODO: "accent-neutral",
  IN_PROGRESS: "accent-primary",
  IN_REVIEW: "accent-warning",
  DONE: "accent-success",
  CANCELLED: "accent-destructive",
};

export const ISSUE_PRIORITY_BADGE_VARIANT: Record<TIssuePriority, BadgeVariant> = {
  LOW: "outline-neutral",
  MEDIUM: "accent-primary",
  HIGH: "accent-warning",
  CRITICAL: "accent-destructive",
};

export const ISSUE_TYPE_BADGE_VARIANT: Record<TIssueType, BadgeVariant> = {
  STORY: "accent-primary",
  TASK: "accent-neutral",
  BUG: "accent-destructive",
  EPIC: "accent-success",
};

export const formatDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    const formatter = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return formatter.format(new Date(value));
  } catch (error) {
    console.error("Invalid date provided to formatDate:", value, error);
    return null;
  }
};

export const formatDateRange = (startDate: string | null, endDate: string | null): string => {
  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);

  if (formattedStart && formattedEnd) return `${formattedStart} – ${formattedEnd}`;
  if (formattedStart) return `${formattedStart}`;
  if (formattedEnd) return `${formattedEnd}`;
  return "Không có thời gian";
};

export const formatIssueIdentifier = (sequenceId: number | null | undefined): string => {
  if (sequenceId === null || sequenceId === undefined) return "#?";
  return `#${sequenceId}`;
};

export const formatIssueKey = (
  projectIdentifier: string | null | undefined,
  sequenceId: number | null | undefined
): string => {
  if (!projectIdentifier) return formatIssueIdentifier(sequenceId);
  if (sequenceId === null || sequenceId === undefined) return `${projectIdentifier}-?`;
  return `${projectIdentifier}-${sequenceId}`;
};
