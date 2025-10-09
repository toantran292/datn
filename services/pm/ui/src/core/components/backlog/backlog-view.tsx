"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  MoreHorizontal,
  Plus,
  UserRound,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  Circle,
  GripVertical,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { Badge, Button, Checkbox, Input, Loader } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";

import { IIssue, IReorderIssuePayload } from "@/core/types/issue";
import {
  formatDate,
  formatDateRange,
  formatIssueKey,
  ISSUE_PRIORITY_BADGE_VARIANT,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATE_BADGE_VARIANT,
  ISSUE_STATE_LABELS,
  ISSUE_TYPE_BADGE_VARIANT,
  ISSUE_TYPE_LABELS,
} from "./utils";

export type TBacklogSectionType = "sprint" | "backlog";

export interface IBacklogSectionData {
  id: string;
  name: string;
  type: TBacklogSectionType;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  issues: IIssue[];
}

export interface IBacklogCreateSprintPayload {
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface BacklogViewProps {
  sections: IBacklogSectionData[];
  projectIdentifier?: string | null;
  isLoading?: boolean;
  onCreateIssue?: (sectionId: string, issueName: string) => Promise<void>;
  onCreateSprint?: (payload: IBacklogCreateSprintPayload) => Promise<void>;
  onIssueDrop?: (payload: BacklogIssueDropPayload) => void;
  onCompleteSprint?: (sprintId: string) => void;
  onStartSprint?: (sprintId: string, issueCount: number) => void;
}

export type BacklogIssueDropPayload = IReorderIssuePayload;

const BacklogViewComponent: React.FC<BacklogViewProps> = (props) => {
  const {
    sections,
    projectIdentifier,
    isLoading,
    onCreateIssue,
    onIssueDrop,
    onCompleteSprint,
    onCreateSprint,
    onStartSprint,
  } = props;

  const [draftSectionId, setDraftSectionId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const [isSprintSubmitting, setIsSprintSubmitting] = useState(false);

  const sprintCount = useMemo(() => sections.filter((section) => section.type === "sprint").length, [sections]);
  const defaultSprintName = useMemo(() => `Sprint ${sprintCount + 1}`, [sprintCount]);

  const resetDraft = useCallback(() => {
    setDraftSectionId(null);
    setDraftName("");
    setDraftError(null);
  }, []);

  const handleStartDraft = useCallback((sectionId: string) => {
    setDraftSectionId(sectionId);
    setDraftName("");
    setDraftError(null);
  }, []);

  const handleCancelDraft = useCallback(() => {
    if (isSubmitting) return;
    resetDraft();
  }, [isSubmitting, resetDraft]);

  const handleSubmitDraft = useCallback(async () => {
    if (!draftSectionId || !onCreateIssue) return;
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      setDraftError("Tên công việc là bắt buộc");
      return;
    }
    setIsSubmitting(true);
    setDraftError(null);
    try {
      await onCreateIssue(draftSectionId, trimmedName);
      resetDraft();
    } catch (error: any) {
      const message = error?.message ?? "Không thể tạo công việc. Vui lòng thử lại.";
      setDraftError(typeof message === "string" ? message : "Không thể tạo công việc. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }, [draftSectionId, draftName, onCreateIssue, resetDraft]);

  const handleSprintQuickCreate = useCallback(async () => {
    if (!onCreateSprint || isSprintSubmitting) return;

    setIsSprintSubmitting(true);
    try {
      await onCreateSprint({
        name: defaultSprintName,
        goal: null,
        startDate: null,
        endDate: null,
      });
    } catch (error) {
      // handled via upstream toast
    } finally {
      setIsSprintSubmitting(false);
    }
  }, [onCreateSprint, defaultSprintName, isSprintSubmitting]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Loader className="space-y-1 p-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Loader.Item key={index} height="60px" className="w-full rounded-md" />
          ))}
        </Loader>
      );
    }

    if (!sections.length) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <div className="flex items-center justify-center size-16 rounded-full bg-custom-background-80">
            <Circle className="size-8 text-custom-text-300" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-custom-text-100">Backlog đang trống</h3>
            <p className="text-sm text-custom-text-300 max-w-md">
              Hãy tạo sprint hoặc công việc mới để bắt đầu quản lý dự án của bạn.
            </p>
          </div>
          <Button variant="primary" size="md" className="gap-2 mt-2" disabled>
            <Plus className="size-4" />
            Tạo sprint đầu tiên
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col overflow-y-auto h-full">
        {sections.map((section) => (
          <BacklogSection
            key={section.id}
            data={section}
            projectIdentifier={projectIdentifier}
            onStartCreate={handleStartDraft}
            onSubmitDraft={handleSubmitDraft}
            onCancelDraft={handleCancelDraft}
            onDraftNameChange={setDraftName}
            draftName={draftSectionId === section.id ? draftName : ""}
            isCreating={draftSectionId === section.id}
            isSubmitting={isSubmitting}
            draftError={draftSectionId === section.id ? draftError : null}
            onCompleteSprint={onCompleteSprint}
            onCreateAvailable={Boolean(onCreateIssue)}
            onIssueDrop={onIssueDrop}
            onCreateSprint={section.type === "backlog" ? handleSprintQuickCreate : undefined}
            isSprintCreating={isSprintSubmitting}
            onStartSprint={onStartSprint}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex-1 rounded-lg border border-custom-border-200 bg-custom-background-100 shadow-sm overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

interface BacklogSectionProps {
  data: IBacklogSectionData;
  projectIdentifier?: string | null;
  onStartCreate?: (sectionId: string) => void;
  onSubmitDraft?: () => void;
  onCancelDraft?: () => void;
  onDraftNameChange?: (value: string) => void;
  draftName: string;
  isCreating: boolean;
  isSubmitting: boolean;
  draftError: string | null;
  onCompleteSprint?: (sprintId: string) => void;
  onCreateAvailable: boolean;
  onIssueDrop?: (payload: BacklogIssueDropPayload) => void;
  onCreateSprint?: () => void;
  isSprintCreating?: boolean;
  onStartSprint?: (sprintId: string, issueCount: number) => void;
}

const BacklogSection: React.FC<BacklogSectionProps> = (props) => {
  const {
    data,
    projectIdentifier,
    onStartCreate,
    onSubmitDraft,
    onCancelDraft,
    onDraftNameChange,
    draftName,
    isCreating,
    isSubmitting,
    draftError,
    onCompleteSprint,
    onCreateAvailable,
    onIssueDrop,
    onCreateSprint,
    isSprintCreating,
    onStartSprint,
  } = props;
  const { id, name, type, issues, startDate, endDate, goal } = data;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const sectionKey: string | null = type === "backlog" ? null : id;

  const issueCount = issues.length;
  const hasStarted = Boolean(startDate);
  const subtitle = type === "sprint" ? formatDateRange(startDate ?? null, endDate ?? null) : (goal ?? "");

  // Calculate issue counts by status
  const statusCounts = useMemo(() => {
    const counts = { todo: 0, inProgress: 0, done: 0 };
    issues.forEach((issue) => {
      if (issue.state === "DONE") counts.done++;
      else if (issue.state === "IN_PROGRESS" || issue.state === "IN_REVIEW") counts.inProgress++;
      else counts.todo++;
    });
    return counts;
  }, [issues]);

  const handleCreateIssue = () => onStartCreate?.(id);
  const handleCompleteSprint = () => type === "sprint" && onCompleteSprint?.(id);
  const handleStartSprint = () => type === "sprint" && onStartSprint?.(id, issueCount);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmitDraft?.();
  };

  return (
    <section className="border-b border-custom-border-200 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-custom-background-90 px-5 py-3.5 transition-colors hover:bg-custom-background-80">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 text-left"
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          <ChevronDown
            className={cn("size-4 text-custom-text-300 transition-transform shrink-0", {
              "-rotate-90": isCollapsed,
            })}
          />
          <div className="flex min-w-0 flex-1 items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-custom-text-100">{name}</span>
              {type === "sprint" && hasStarted && (
                <Badge variant="primary" size="sm" className="flex gap-1">
                  <PlayCircle className="size-3" />
                  Đang hoạt động
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline-neutral" size="sm" className="cursor-default font-medium">
                {statusCounts.todo}
              </Badge>
              <Badge variant="outline-neutral" size="sm" className="cursor-default font-medium text-blue-500">
                {statusCounts.inProgress}
              </Badge>
              <Badge variant="outline-neutral" size="sm" className="cursor-default font-medium text-green-500">
                {statusCounts.done}
              </Badge>
            </div>
            {subtitle && (
              <span className="truncate text-xs text-custom-text-300 flex items-center gap-1.5">
                <CalendarDays className="size-3" />
                {subtitle}
              </span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2">
          {type === "sprint" && onStartSprint && !hasStarted ? (
            <Button variant="primary" size="sm" onClick={handleStartSprint} className="gap-2">
              <PlayCircle className="size-4" />
              Bắt đầu sprint
            </Button>
          ) : null}
          {type === "sprint" && onCompleteSprint && hasStarted ? (
            <Button variant="neutral-primary" size="sm" onClick={handleCompleteSprint} className="gap-2">
              <StopCircle className="size-4" />
              Hoàn thành sprint
            </Button>
          ) : null}
          {type === "backlog" && onCreateSprint ? (
            <Button
              type="button"
              variant="neutral-primary"
              size="sm"
              onClick={onCreateSprint}
              disabled={isSprintCreating}
              className="gap-2"
            >
              <Plus className="size-4" />
              {isSprintCreating ? "Đang tạo sprint" : "Tạo sprint"}
            </Button>
          ) : null}
          <Button variant="link-neutral" size="sm" className="text-custom-text-300 hover:text-custom-text-200">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>
      {!isCollapsed && (
        <div className="border-t border-custom-border-200">
          {issueCount > 0 ? (
            <div className="divide-y divide-custom-border-200">
              {issues.map((issue) => (
                <BacklogIssueRow
                  key={issue.id}
                  issue={issue}
                  projectIdentifier={projectIdentifier}
                  sectionId={sectionKey}
                  onDropIssue={onIssueDrop}
                />
              ))}
            </div>
          ) : (
            <EmptySectionDropArea sectionId={sectionKey} onDropIssue={onIssueDrop}>
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex items-center justify-center size-12 rounded-full bg-custom-background-80 mb-3">
                  <Circle className="size-6 text-custom-text-300" />
                </div>
                <p className="text-sm font-medium text-custom-text-200 mb-1">
                  {type === "sprint" ? "Sprint chưa có công việc" : "Backlog đang trống"}
                </p>
                <p className="text-xs text-custom-text-300 max-w-md">
                  {type === "sprint"
                    ? "Kéo thả công việc từ backlog hoặc tạo mới để bắt đầu."
                    : "Tạo công việc mới hoặc kéo từ sprint để quản lý backlog."}
                </p>
              </div>
            </EmptySectionDropArea>
          )}

          {isCreating ? (
            <form onSubmit={handleSubmit} className="border-t border-custom-border-200 bg-custom-background-90">
              <div className="flex items-center gap-3 px-5 py-3">
                <GripVertical className="size-4 text-custom-text-400 opacity-0 shrink-0" />
                <Checkbox disabled containerClassName="shrink-0" />
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <CheckCircle2 className="size-4 text-custom-text-300 shrink-0" />
                  <Input
                    ref={inputRef}
                    value={draftName}
                    onChange={(event) => onDraftNameChange?.(event.target.value)}
                    placeholder="Nhập tiêu đề công việc..."
                    disabled={isSubmitting}
                    className="flex-1 bg-custom-background-100"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button type="submit" size="sm" variant="primary" disabled={isSubmitting || !draftName.trim()}>
                    {isSubmitting ? "Đang tạo..." : "Tạo"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="neutral-primary"
                    onClick={onCancelDraft}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
              {draftError && (
                <p className="px-5 pb-3 text-sm text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="size-3.5" />
                  {draftError}
                </p>
              )}
            </form>
          ) : (
            onCreateAvailable && (
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-custom-border-200 px-5 py-3 text-sm font-medium text-custom-text-300 hover:text-custom-primary-100 hover:bg-custom-background-90 transition-colors"
                onClick={handleCreateIssue}
              >
                <Plus className="size-4" />
                Tạo công việc
              </button>
            )
          )}
          <SectionDropZone sectionId={sectionKey} onDropIssue={onIssueDrop} />
        </div>
      )}
    </section>
  );
};

const BacklogIssueRow: React.FC<{
  issue: IIssue;
  projectIdentifier?: string | null;
  sectionId: string | null;
  onDropIssue?: (payload: BacklogIssueDropPayload) => void;
}> = ({ issue, projectIdentifier, sectionId, onDropIssue }) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(null);

  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        getInitialData: () => ({
          type: "ISSUE_ROW",
          issueId: issue.id,
          sectionId,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source?.data?.type === "ISSUE_ROW" && source?.data?.issueId !== issue.id,
        getData: ({ input, element }) => {
          const rect = element.getBoundingClientRect();
          const isAfter = input.clientY >= rect.top + rect.height / 2;
          const position = isAfter ? "after" : "before";
          setDropPosition(position);
          return {
            type: "ISSUE_ROW_TARGET",
            issueId: issue.id,
            sectionId,
            position,
          };
        },
        onDragLeave: () => {
          setDropPosition(null);
        },
        onDrop: ({ source, self }) => {
          setDropPosition(null);
          const sourceData = source?.data as { type?: string; issueId?: string; sectionId?: string | null } | undefined;
          const targetData = self?.data as
            | { issueId?: string; sectionId?: string | null; position?: "before" | "after" }
            | undefined;

          if (!sourceData || sourceData.type !== "ISSUE_ROW" || !targetData) return;

          onDropIssue?.({
            issueId: sourceData.issueId ?? "",
            fromSectionId: sourceData.sectionId ?? null,
            toSectionId: targetData.sectionId ?? null,
            destinationIssueId: targetData.issueId ?? null,
            position: targetData.position ?? "after",
          });
        },
      })
    );
  }, [issue.id, sectionId, onDropIssue]);

  const issueKey = formatIssueKey(projectIdentifier, issue.sequenceId);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" };
      case "HIGH":
        return { icon: ArrowUp, color: "text-orange-500", bg: "bg-orange-500/10" };
      case "MEDIUM":
        return { icon: Minus, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "LOW":
        return { icon: ArrowDown, color: "text-blue-500", bg: "bg-blue-500/10" };
      default:
        return { icon: Minus, color: "text-custom-text-300", bg: "bg-custom-background-90" };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "TASK":
        return CheckCircle2;
      case "BUG":
        return AlertCircle;
      case "STORY":
        return Circle;
      default:
        return Circle;
    }
  };

  const priorityConfig = getPriorityConfig(issue.priority);
  const PriorityIcon = priorityConfig.icon;
  const TypeIcon = getTypeIcon(issue.type);

  return (
    <div className="relative">
      {dropPosition === "before" && (
        <div className="absolute -top-[1px] left-0 right-0 h-0.5 rounded-full bg-custom-primary-100 z-10" />
      )}
      {dropPosition === "after" && (
        <div className="absolute -bottom-[1px] left-0 right-0 h-0.5 rounded-full bg-custom-primary-100 z-10" />
      )}
      <div
        ref={rowRef}
        className={cn(
          "group flex items-center gap-3 px-5 py-3 transition-all hover:bg-custom-background-90 cursor-grab active:cursor-grabbing",
          {
            "opacity-50": isDragging,
            "bg-custom-background-90": isDragging,
          }
        )}
      >
        <GripVertical className="size-4 text-custom-text-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        <Checkbox id={`${issue.id}-checkbox`} containerClassName="shrink-0" />

        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <TypeIcon className="size-4 text-custom-text-300 shrink-0" />
            <span className="shrink-0 text-xs font-semibold text-custom-text-300 min-w-[80px]">{issueKey}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-custom-text-100">{issue.name}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={ISSUE_STATE_BADGE_VARIANT[issue.state]} size="sm" className="min-w-[100px] justify-center">
            {ISSUE_STATE_LABELS[issue.state]}
          </Badge>

          <button
            className={cn(
              "flex items-center justify-center size-8 rounded transition-colors",
              priorityConfig.bg,
              "hover:brightness-110"
            )}
            title={`Ưu tiên: ${ISSUE_PRIORITY_LABELS[issue.priority]}`}
          >
            <PriorityIcon className={cn("size-4", priorityConfig.color)} />
          </button>

          <div className="flex items-center -space-x-2">
            {issue.assignees.length > 0 ? (
              <>
                {issue.assignees.slice(0, 3).map((assignee, index) => (
                  <div
                    key={assignee || index}
                    className="size-7 rounded-full bg-custom-primary-100 border-2 border-custom-background-100 flex items-center justify-center text-[10px] font-medium text-white"
                    title={assignee || "Assignee"}
                  >
                    {(assignee || "U").charAt(0).toUpperCase()}
                  </div>
                ))}
                {issue.assignees.length > 3 && (
                  <div className="size-7 rounded-full bg-custom-background-80 border-2 border-custom-background-100 flex items-center justify-center text-[10px] font-medium text-custom-text-200">
                    +{issue.assignees.length - 3}
                  </div>
                )}
              </>
            ) : (
              <div
                className="size-7 rounded-full bg-custom-background-80 border-2 border-custom-background-100 flex items-center justify-center"
                title="Chưa phân công"
              >
                <UserRound className="size-3.5 text-custom-text-300" />
              </div>
            )}
          </div>

          <Button
            variant="link-neutral"
            size="sm"
            className="text-custom-text-300 hover:text-custom-text-200 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const EmptySectionDropArea: React.FC<{
  sectionId: string | null;
  onDropIssue?: (payload: BacklogIssueDropPayload) => void;
  children: ReactNode;
}> = ({ sectionId, onDropIssue, children }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => source?.data?.type === "ISSUE_ROW",
      onDragEnter: () => setIsActive(true),
      onDragLeave: () => setIsActive(false),
      getData: () => ({ type: "SECTION_EMPTY", sectionId }),
      onDrop: ({ source }) => {
        setIsActive(false);
        const sourceData = source?.data as { type?: string; issueId?: string; sectionId?: string | null } | undefined;
        if (!sourceData || sourceData.type !== "ISSUE_ROW") return;
        onDropIssue?.({
          issueId: sourceData.issueId ?? "",
          fromSectionId: sourceData.sectionId ?? null,
          toSectionId: sectionId,
          destinationIssueId: null,
          position: "end",
        });
      },
    });
  }, [sectionId, onDropIssue]);

  return (
    <div
      ref={containerRef}
      className={cn("transition-all duration-200", {
        "bg-custom-primary-100/10 ring-2 ring-custom-primary-100 ring-inset": isActive,
      })}
    >
      {children}
    </div>
  );
};

const SectionDropZone: React.FC<{
  sectionId: string | null;
  onDropIssue?: (payload: BacklogIssueDropPayload) => void;
}> = ({ sectionId, onDropIssue }) => {
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const element = dropRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => source?.data?.type === "ISSUE_ROW",
      getData: () => ({ type: "SECTION_END", sectionId }),
      onDragEnter: () => setIsActive(true),
      onDragLeave: () => setIsActive(false),
      onDrop: ({ source }) => {
        setIsActive(false);
        const sourceData = source?.data as { type?: string; issueId?: string; sectionId?: string | null } | undefined;
        if (!sourceData || sourceData.type !== "ISSUE_ROW") return;
        onDropIssue?.({
          issueId: sourceData.issueId ?? "",
          fromSectionId: sourceData.sectionId ?? null,
          toSectionId: sectionId,
          destinationIssueId: null,
          position: "end",
        });
      },
    });
  }, [sectionId, onDropIssue]);

  return (
    <div
      ref={dropRef}
      className={cn("h-12 transition-all duration-200 border-t border-transparent", {
        "bg-custom-primary-100/10 border-custom-primary-100 border-dashed": isActive,
      })}
    >
      {isActive && (
        <div className="flex items-center justify-center h-full">
          <p className="text-xs text-custom-primary-100 font-medium">Thả để thêm vào cuối danh sách</p>
        </div>
      )}
    </div>
  );
};

export const BacklogView = observer(BacklogViewComponent);
