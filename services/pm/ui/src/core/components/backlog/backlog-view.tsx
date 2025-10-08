"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { CalendarDays, ChevronDown, MoreHorizontal, Plus, UserRound } from "lucide-react";

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

  const sprintCount = useMemo(
    () => sections.filter((section) => section.type === "sprint").length,
    [sections]
  );
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
        <Loader className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Loader.Item key={index} height="56px" className="w-full" />
          ))}
        </Loader>
      );
    }

    if (!sections.length) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-custom-text-300">
          <span>Chưa có dữ liệu backlog.</span>
          <span>Hãy tạo sprint hoặc công việc mới để bắt đầu.</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col divide-y divide-custom-border-200">
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
      <div className="flex-1 rounded-lg border border-custom-border-200 bg-custom-background-100 shadow-sm">
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
  const subtitle = type === "sprint" ? formatDateRange(startDate ?? null, endDate ?? null) : goal ?? "";

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
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-custom-background-90 px-4 py-3">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 text-left"
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          <ChevronDown
            className={cn("size-4 text-custom-text-300 transition-transform", {
              "-rotate-90": isCollapsed,
            })}
          />
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="truncate text-sm font-semibold text-custom-text-100">{name}</span>
            <Badge variant="outline-neutral" size="sm" className="cursor-default">
              {issueCount} công việc
            </Badge>
            {subtitle && <span className="truncate text-xs text-custom-text-300">{subtitle}</span>}
          </div>
        </button>
        <div className="flex items-center gap-2">
          {type === "sprint" && onStartSprint && !hasStarted ? (
            <Button variant="primary" size="sm" onClick={handleStartSprint}>
              Bắt đầu sprint
            </Button>
          ) : null}
          {type === "sprint" && onCompleteSprint && hasStarted ? (
            <Button variant="neutral-primary" size="sm" onClick={handleCompleteSprint}>
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
            >
              {isSprintCreating ? "Đang tạo sprint" : "Tạo sprint"}
            </Button>
          ) : null}
          {onCreateAvailable && (
            <Button variant="neutral-primary" size="sm" onClick={handleCreateIssue}>
              <Plus className="size-4" />
            </Button>
          )}
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
              <div className="px-4 py-8 text-center text-sm text-custom-text-300">
                {type === "sprint"
                  ? "Sprint này chưa có công việc nào. Hãy kéo thả hoặc tạo mới."
                  : "Backlog đang trống. Kéo thả công việc từ sprint hoặc tạo mới để bắt đầu."}
              </div>
            </EmptySectionDropArea>
          )}

          {isCreating ? (
            <form onSubmit={handleSubmit} className="border-t border-custom-border-200">
              <div className="flex items-center gap-4 px-4 py-3">
                <Checkbox disabled containerClassName="mt-0.5" />
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-custom-text-300">
                    {type === "sprint" ? "SPRINT" : "BACKLOG"}
                  </span>
                  <Input
                    ref={inputRef}
                    value={draftName}
                    onChange={(event) => onDraftNameChange?.(event.target.value)}
                    placeholder="Nhập tên công việc"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? "Đang tạo" : "Tạo"}
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
              {draftError && <p className="px-4 pb-3 text-sm text-red-500">{draftError}</p>}
            </form>
            ) : (
            onCreateAvailable && (
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-custom-border-200 px-4 py-3 text-sm font-medium text-custom-primary-100 hover:bg-custom-background-90"
                onClick={handleCreateIssue}
              >
                <Plus className="size-4" />
                Tạo công việc mới
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
            const sourceData = source?.data as
              | { type?: string; issueId?: string; sectionId?: string | null }
              | undefined;
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
        }
      )
    );
  }, [issue.id, sectionId, onDropIssue]);

  const issueKey = formatIssueKey(projectIdentifier, issue.sequenceId);
  const dueText = issue.targetDate ? formatDate(issue.targetDate) : "Không có hạn";
  const assigneeLabel = issue.assignees.length > 0 ? `${issue.assignees.length} người` : "Chưa phân công";

  return (
    <div className="relative">
      {dropPosition === "before" && (
        <div className="absolute -top-[1px] left-0 right-0 h-0.5 bg-custom-primary-100" />
      )}
      {dropPosition === "after" && (
        <div className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-custom-primary-100" />
      )}
      <div
        ref={rowRef}
        className={cn(
          "group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-custom-background-90",
          {
            "opacity-60": isDragging,
          }
        )}
      >
        <Checkbox id={`${issue.id}-checkbox`} containerClassName="mt-0.5" />
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-custom-text-300">
          {issueKey}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-custom-text-100">{issue.name}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-custom-text-300">
        <Badge variant={ISSUE_TYPE_BADGE_VARIANT[issue.type]} size="sm">
          {ISSUE_TYPE_LABELS[issue.type]}
        </Badge>
        <Badge variant={ISSUE_STATE_BADGE_VARIANT[issue.state]} size="sm">
          {ISSUE_STATE_LABELS[issue.state]}
        </Badge>
        <Badge variant={ISSUE_PRIORITY_BADGE_VARIANT[issue.priority]} size="sm">
          Ưu tiên: {ISSUE_PRIORITY_LABELS[issue.priority]}
        </Badge>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <CalendarDays className="size-3" />
          {dueText}
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <UserRound className="size-3" />
          {assigneeLabel}
        </span>
      </div>
      <Button variant="link-neutral" size="sm" className="text-custom-text-300">
        <MoreHorizontal className="size-5" />
      </Button>
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
        const sourceData = source?.data as
          | { type?: string; issueId?: string; sectionId?: string | null }
          | undefined;
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
      className={cn("transition-colors", {
        "bg-custom-primary-30/20": isActive,
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
        const sourceData = source?.data as
          | { type?: string; issueId?: string; sectionId?: string | null }
          | undefined;
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
      className={cn(
        "h-12 transition-colors",
        {
          "bg-custom-primary-30/20": isActive,
        }
      )}
    />
  );
};

export const BacklogView = observer(BacklogViewComponent);
