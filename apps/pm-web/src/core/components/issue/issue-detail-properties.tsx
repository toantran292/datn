"use client";

import {
  Circle,
  Users,
  Signal,
  User,
  Calendar,
  CalendarClock,
  Tag,
  Network,
  Hash,
} from "lucide-react";
import { Badge } from "@uts/design-system/ui";
import { IIssue } from "@/core/types/issue";
import {
  ISSUE_PRIORITY_BADGE_VARIANT,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATE_BADGE_VARIANT,
  ISSUE_STATE_LABELS,
  ISSUE_TYPE_BADGE_VARIANT,
  ISSUE_TYPE_LABELS,
  formatDate,
} from "@/core/components/backlog/utils";

interface IssueDetailPropertiesProps {
  issue: IIssue;
  locationLabel?: string | null;
  disabled?: boolean;
}

export const IssueDetailProperties: React.FC<IssueDetailPropertiesProps> = ({
  issue,
  locationLabel,
  disabled = false,
}) => {
  const formattedStartDate = formatDate(issue.startDate);
  const formattedDueDate = formatDate(issue.targetDate);
  const formattedCreatedAt = formatDate(issue.createdAt);

  const sprintLabel = issue.sprintId ? (locationLabel ?? "Không xác định") : (locationLabel ?? "Backlog");

  const renderAssignees = () => {
    if (!issue.assignees.length) {
      return <span className="text-sm text-custom-text-400">Add assignees</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {issue.assignees.map((assignee, index) => (
          <div
            key={`${assignee}-${index}`}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-primary-100 text-xs font-semibold text-white"
          >
            {(assignee || "U").charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h6 className="text-sm font-medium">Properties</h6>
      <div className={`w-full space-y-2 mt-3 ${disabled ? "opacity-60" : ""}`}>
        {/* state */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Circle className="h-4 w-4 flex-shrink-0" />
            <span>State</span>
          </div>
          <div className="w-3/4 flex-grow">
            <Badge variant={ISSUE_STATE_BADGE_VARIANT[issue.state]} size="sm">
              {ISSUE_STATE_LABELS[issue.state]}
            </Badge>
          </div>
        </div>

        {/* assignee */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>Assignees</span>
          </div>
          <div className="w-3/4 flex-grow">{renderAssignees()}</div>
        </div>

        {/* priority */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Signal className="h-4 w-4 flex-shrink-0" />
            <span>Priority</span>
          </div>
          <div className="w-3/4 flex-grow">
            <Badge variant={ISSUE_PRIORITY_BADGE_VARIANT[issue.priority]} size="sm">
              {ISSUE_PRIORITY_LABELS[issue.priority]}
            </Badge>
          </div>
        </div>

        {/* created by */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <User className="h-4 w-4 flex-shrink-0" />
            <span>Created by</span>
          </div>
          <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm justify-between cursor-not-allowed">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-primary-100 text-xs font-semibold text-white">
              U
            </div>
            <span className="flex-grow truncate leading-5">User</span>
          </div>
        </div>

        {/* start date */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Start date</span>
          </div>
          <div className="w-3/4 flex-grow">
            {formattedStartDate ? (
              <span className="text-sm">{formattedStartDate}</span>
            ) : (
              <span className="text-sm text-custom-text-400">Add start date</span>
            )}
          </div>
        </div>

        {/* due date */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <CalendarClock className="h-4 w-4 flex-shrink-0" />
            <span>Due date</span>
          </div>
          <div className="flex items-center gap-2">
            {formattedDueDate ? (
              <span className="text-sm">{formattedDueDate}</span>
            ) : (
              <span className="text-sm text-custom-text-400">Add due date</span>
            )}
          </div>
        </div>

        {/* parent */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Network className="h-4 w-4 flex-shrink-0" />
            <span>Parent</span>
          </div>
          <div className="w-3/4 flex-grow">
            <span className="text-sm text-custom-text-400">Add parent work item</span>
          </div>
        </div>

        {/* label */}
        <div className="flex w-full items-center gap-3 min-h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Tag className="h-4 w-4 flex-shrink-0" />
            <span>Labels</span>
          </div>
          <div className="flex w-full flex-col gap-3 truncate">
            <span className="text-sm text-custom-text-400">Select label</span>
          </div>
        </div>
      </div>
    </div>
  );
};
