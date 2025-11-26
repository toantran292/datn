"use client";

import { memo, useMemo, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  CalendarDays,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Users2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Signal,
  CheckCircle2,
  Circle,
  MoreVertical,
} from "lucide-react";
import {
  Badge,
  Button,
  Checkbox,
  Input,
  ModalCore,
  EModalWidth,
  EModalPosition,
  setToast,
  TOAST_TYPE,
} from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";

import type { IIssueStore } from "@/core/store/issue/issue.store";
import type { IIssue } from "@/core/types/issue";
import type { ISprint } from "@/core/types/sprint";
import { formatIssueKey } from "@/core/components/backlog/utils";

const IssueDetailPanel = dynamic(
  () => import("@/core/components/issue/issue-detail-panel").then((mod) => mod.IssueDetailPanel),
  { ssr: false }
);


type BoardViewProps = {
  projectId: string;
  issues: IIssue[];
  sprint?: ISprint;
  issueStore: IIssueStore;
  projectIdentifier?: string | null;
};

const COLUMN_ORDER = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
type ColumnKey = (typeof COLUMN_ORDER)[number];

const COLUMN_TITLES: Record<ColumnKey, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export const BoardView = memo(function BoardView({ projectId, issues, sprint, issueStore, projectIdentifier }: BoardViewProps) {
  const grouped = useMemo(() => {
    const map: Record<ColumnKey, IIssue[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
    };

    issues.forEach((issue) => {
      if (issue.state === "CANCELLED") return;
      const key =
        issue.state === "IN_PROGRESS" || issue.state === "IN_REVIEW" || issue.state === "DONE"
          ? (issue.state as ColumnKey)
          : "TODO";
      map[key].push(issue);
    });

    (Object.keys(map) as ColumnKey[]).forEach((key) => {
      map[key].sort((a, b) => {
        const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return a.createdAt.localeCompare(b.createdAt);
      });
    });

    return map;
  }, [issues]);

  const [newIssueName, setNewIssueName] = useState("");
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnKey | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const selectedIssue = selectedIssueId ? issueStore.getIssueById(selectedIssueId) ?? null : null;
  const locationLabel = sprint?.name ?? null;

  useEffect(() => {
    if (selectedIssueId && !issueStore.getIssueById(selectedIssueId)) {
      setSelectedIssueId(null);
    }
  }, [selectedIssueId, issueStore, issues.length]);

  const handleQuickCreate = async () => {
    if (!sprint) {
      setToast({ type: TOAST_TYPE.INFO, title: "Thông báo", message: "Vui lòng bắt đầu sprint trước." });
      return;
    }

    const trimmed = newIssueName.trim();
    if (!trimmed) {
      setToast({ type: TOAST_TYPE.INFO, title: "Thông báo", message: "Vui lòng nhập tên công việc" });
      return;
    }

    setIsCreatingIssue(true);
    try {
      const created = await issueStore.createIssue({
        projectId,
        sprintId: sprint.id,
        parentId: null,
        name: trimmed,
        description: null,
        descriptionHtml: null,
        state: "TODO",
        priority: "MEDIUM",
        type: "TASK",
        point: null,
        sequenceId: null,
        sortOrder: null,
        startDate: null,
        targetDate: null,
        assignees: [],
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Đã tạo công việc", message: created.name });
      setNewIssueName("");
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? "Không thể tạo công việc. Vui lòng thử lại.";
      setToast({ type: TOAST_TYPE.ERROR, title: "Lỗi", message: typeof message === "string" ? message : undefined });
    } finally {
      setIsCreatingIssue(false);
    }
  };

  const handleDropOnColumn = useCallback(
    async (column: ColumnKey, destinationIssueId: string | null, position: "before" | "after" | "end") => {
      if (!draggedIssueId || !sprint) return;
      const issue = issueStore.getIssueById(draggedIssueId);
      if (!issue) return;

      try {
        let latestIssue = issue;
        if (issue.state !== column) {
          await issueStore.updateIssue(draggedIssueId, { state: column });
          latestIssue = issueStore.getIssueById(draggedIssueId) ?? issue;
        }

        await issueStore.reorderIssue(projectId, {
          issueId: draggedIssueId,
          fromSectionId: latestIssue.sprintId,
          toSectionId: sprint.id,
          destinationIssueId,
          position,
        });
      } catch (error: any) {
        const message =
          error?.response?.data?.message ?? error?.message ?? "Không thể cập nhật công việc. Vui lòng thử lại.";
        setToast({ type: TOAST_TYPE.ERROR, title: "Lỗi", message: typeof message === "string" ? message : undefined });
      } finally {
        setDraggedIssueId(null);
        setActiveColumn(null);
      }
    },
    [draggedIssueId, issueStore, projectId, sprint]
  );

  const handleColumnDragEnter = useCallback((column: ColumnKey) => {
    setActiveColumn(column);
  }, []);

  const handleUpdateIssue = useCallback(
    async (issueId: string, data: Partial<IIssue>) => {
      try {
        await issueStore.updateIssue(issueId, data);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Đã cập nhật công việc",
          message: "Thông tin đã được lưu.",
        });
      } catch (error: any) {
        const apiMessage =
          error?.response?.data?.message ?? error?.message ?? "Không thể cập nhật công việc. Vui lòng thử lại.";
        const finalMessage =
          typeof apiMessage === "string" ? apiMessage : "Không thể cập nhật công việc. Vui lòng thử lại.";
        setToast({ type: TOAST_TYPE.ERROR, title: "Lỗi", message: finalMessage });
        throw new Error(finalMessage);
      }
    },
    [issueStore]
  );

  const handleCloseDetail = useCallback(() => setSelectedIssueId(null), []);

  if (!sprint) {
    return <EmptyBoardState />;
  }

  return (
    <>
      <div className="flex h-full flex-col gap-4">
        <BoardToolbar />
        <SprintSummary sprint={sprint} issueCount={issues.length} />
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4 pt-2">
          {COLUMN_ORDER.map((column) => (
            <BoardColumn
              key={column}
              columnKey={column}
              title={COLUMN_TITLES[column]}
              issues={grouped[column]}
              allowQuickCreate={column === "TODO"}
              quickIssueName={newIssueName}
              onQuickIssueNameChange={setNewIssueName}
              onQuickCreate={handleQuickCreate}
              isCreatingIssue={isCreatingIssue}
              onIssueDrop={handleDropOnColumn}
              onIssueDragStart={(issueId) => {
                setDraggedIssueId(issueId);
                setActiveColumn(column);
              }}
              onIssueDragEnd={() => {
                setDraggedIssueId(null);
                setActiveColumn(null);
              }}
              isActive={activeColumn === column}
              onColumnDragEnter={handleColumnDragEnter}
              onIssueClick={setSelectedIssueId}
              projectIdentifier={projectIdentifier}
            />
          ))}
        </div>
      </div>

      {selectedIssue ? (
        <IssueDetailModal
          issue={selectedIssue}
          isOpen
          onClose={handleCloseDetail}
          projectIdentifier={projectIdentifier}
          locationLabel={locationLabel}
          onUpdateIssue={handleUpdateIssue}
        />
      ) : null}
    </>
  );
});

const BoardToolbar = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-custom-background-100 rounded-lg p-4 border border-custom-border-200">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-custom-text-300" />
          <Input
            placeholder="Tìm kiếm công việc..."
            className="w-72 pl-9 border-custom-border-200 bg-custom-background-90"
            disabled
          />
        </div>
        <div className="h-6 w-px bg-custom-border-200" />
        <Button variant="neutral-primary" size="sm" disabled className="gap-2">
          <Users2 className="size-4" />
          Thành viên
        </Button>
        <Button variant="neutral-primary" size="sm" disabled className="gap-2">
          <Filter className="size-4" />
          Bộ lọc
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" disabled className="gap-2">
          <CheckCircle2 className="size-4" />
          Hoàn thành sprint
        </Button>
        <Button variant="neutral-primary" size="sm" disabled className="gap-2">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );

const SprintSummary: React.FC<{ sprint: ISprint; issueCount: number }> = ({ sprint, issueCount }) => {
  const calculateProgress = () => {
    if (issueCount === 0) return 0;
    // This is a placeholder - you would calculate actual completion percentage
    return 0;
  };

  const progress = calculateProgress();

  return (
    <div className="rounded-lg border border-custom-border-200 bg-gradient-to-r from-custom-background-100 to-custom-background-90 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-10 rounded-lg bg-custom-primary-100/10">
            <Signal className="size-5 text-custom-primary-100" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-custom-text-100">{sprint.name}</h3>
              <Badge variant="primary" size="sm">
                Đang hoạt động
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-custom-text-300">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                <span>
                  {sprint.startDate && sprint.endDate
                    ? `${sprint.startDate} → ${sprint.endDate}`
                    : "Chưa có lịch trình cụ thể"}
                </span>
              </div>
              <div className="h-3 w-px bg-custom-border-200" />
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" />
                <span>{issueCount} công việc</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-custom-text-100">{progress}%</p>
            <p className="text-xs text-custom-text-300">Hoàn thành</p>
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-custom-background-90 rounded-b-lg overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

const BoardColumn: React.FC<{
  columnKey: ColumnKey;
  title: string;
  issues: IIssue[];
  allowQuickCreate: boolean;
  quickIssueName: string;
  onQuickIssueNameChange: (value: string) => void;
  onQuickCreate: () => void;
  isCreatingIssue: boolean;
  onIssueDrop: (column: ColumnKey, destinationIssueId: string | null, position: "before" | "after" | "end") => void;
  onIssueDragStart: (issueId: string, column: ColumnKey) => void;
  onIssueDragEnd: () => void;
  isActive: boolean;
  onColumnDragEnter: (column: ColumnKey) => void;
  onIssueClick?: (issueId: string) => void;
  projectIdentifier?: string | null;
}> = ({
  columnKey,
  title,
  issues,
  allowQuickCreate,
  quickIssueName,
  onQuickIssueNameChange,
  onQuickCreate,
  isCreatingIssue,
  onIssueDrop,
  onIssueDragStart,
  onIssueDragEnd,
  isActive,
  onColumnDragEnter,
  onIssueClick,
  projectIdentifier,
}) => {
  const [hoveredIssueId, setHoveredIssueId] = useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<"top" | "bottom" | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const getColumnColor = (key: ColumnKey) => {
    switch (key) {
      case "TODO":
        return "border-t-slate-400";
      case "IN_PROGRESS":
        return "border-t-blue-500";
      case "IN_REVIEW":
        return "border-t-yellow-500";
      case "DONE":
        return "border-t-green-500";
      default:
        return "border-t-custom-border-200";
    }
  };

  return (
    <div
      className={cn(
        "flex h-full w-80 min-w-[20rem] flex-col gap-3 rounded-lg border border-custom-border-200 bg-custom-background-90/50 shadow-sm transition-all",
        "border-t-4",
        getColumnColor(columnKey),
        {
          "ring-2 ring-custom-primary-100 bg-custom-background-90": isActive,
        }
      )}
      onDragOver={(event) => {
        event.preventDefault();
        onColumnDragEnter(columnKey);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setHoveredIssueId(null);
        setHoveredPosition(null);
        onIssueDrop(columnKey, null, "end");
      }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-custom-text-100">{title}</h3>
          <Badge variant="outline-neutral" size="sm" className="font-medium">
            {issues.length}
          </Badge>
        </div>
        <button
          className="p-1 hover:bg-custom-background-80 rounded transition-colors"
          onClick={() => setShowQuickCreate(!showQuickCreate)}
          title="Thêm công việc"
        >
          <Plus className="size-4 text-custom-text-300" />
        </button>
      </div>

      {/* Quick Create */}
      {(allowQuickCreate && showQuickCreate) || allowQuickCreate ? (
        <div className="px-3 pb-2">
          <div className="flex flex-col gap-2 rounded-lg border border-custom-border-200 bg-custom-background-100 p-2.5 shadow-sm">
            <input
              value={quickIssueName}
              onChange={(event) => onQuickIssueNameChange(event.target.value)}
              placeholder="Nhập tiêu đề công việc..."
              className="w-full bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
              disabled={isCreatingIssue}
              onKeyDown={(event) => {
                if (event.key === "Enter" && quickIssueName.trim()) {
                  event.preventDefault();
                  onQuickCreate();
                }
                if (event.key === "Escape") {
                  setShowQuickCreate(false);
                  onQuickIssueNameChange("");
                }
              }}
              autoFocus={showQuickCreate}
            />
            {quickIssueName.trim() && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={onQuickCreate}
                  disabled={isCreatingIssue || !quickIssueName.trim()}
                  className="flex-1"
                >
                  {isCreatingIssue ? "Đang tạo..." : "Tạo"}
                </Button>
                <Button
                  size="sm"
                  variant="neutral-primary"
                  onClick={() => {
                    setShowQuickCreate(false);
                    onQuickIssueNameChange("");
                  }}
                  disabled={isCreatingIssue}
                >
                  Hủy
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Issues List */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3">
        {issues.map((issue) => (
          <BoardIssueCard
            key={issue.id}
            issue={issue}
            dragPosition={hoveredIssueId === issue.id ? hoveredPosition : null}
            onDragStart={() => onIssueDragStart(issue.id, columnKey)}
            onDragEnd={() => {
              setHoveredIssueId(null);
              setHoveredPosition(null);
              onIssueDragEnd();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
              const isTop = event.clientY - rect.top < rect.height / 2;
              setHoveredIssueId(issue.id);
              setHoveredPosition(isTop ? "top" : "bottom");
            }}
            onDragLeave={() => {
              setHoveredIssueId((prev) => (prev === issue.id ? null : prev));
              setHoveredPosition((prev) => (hoveredIssueId === issue.id ? null : prev));
            }}
            onDrop={(event) => {
              event.preventDefault();
              const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
              const isTop = event.clientY - rect.top < rect.height / 2;
              const position = isTop ? "before" : "after";
              setHoveredIssueId(null);
              setHoveredPosition(null);
              onIssueDrop(columnKey, issue.id, position);
            }}
            onOpenDetail={() => onIssueClick?.(issue.id)}
            projectIdentifier={projectIdentifier}
          />
        ))}
        {issues.length === 0 && !showQuickCreate ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-custom-border-200 p-6 text-center">
            <Circle className="size-8 text-custom-text-300 mb-2 opacity-50" />
            <p className="text-xs text-custom-text-300">Chưa có công việc</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const BoardIssueCard: React.FC<{
  issue: IIssue;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  dragPosition?: "top" | "bottom" | null;
  onOpenDetail?: () => void;
  projectIdentifier?: string | null;
}> = ({
  issue,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onDragLeave,
  dragPosition,
  onOpenDetail,
  projectIdentifier,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const issueKey = formatIssueKey(projectIdentifier, issue.sequenceId);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return {
          icon: AlertCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
          label: "Khẩn cấp",
        };
      case "HIGH":
        return {
          icon: ArrowUp,
          color: "text-orange-500",
          bg: "bg-orange-500/10",
          label: "Cao",
        };
      case "MEDIUM":
        return {
          icon: Minus,
          color: "text-yellow-500",
          bg: "bg-yellow-500/10",
          label: "Trung bình",
        };
      case "LOW":
        return {
          icon: ArrowDown,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          label: "Thấp",
        };
      default:
        return {
          icon: Minus,
          color: "text-custom-text-300",
          bg: "bg-custom-background-90",
          label: "Chưa xác định",
        };
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
    <div
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-lg border border-custom-border-200 bg-custom-background-100 p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-custom-border-300",
        {
          "cursor-grab active:cursor-grabbing": true,
          "ring-2 ring-custom-primary-100 ring-offset-1": isHovered,
        }
      )}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        setIsDraggingCard(true);
        onDragStart();
      }}
      onDragEnd={() => {
        setIsDraggingCard(false);
        onDragEnd();
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isDraggingCard) return;
        onOpenDetail?.();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetail?.();
        }
        if (event.key === "Escape") {
          event.currentTarget.blur();
        }
      }}
    >
      {dragPosition === "top" ? <div className="-mt-2.5 mb-1 h-0.5 rounded-full bg-custom-primary-100" /> : null}

      {/* Header with checkbox and actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Checkbox id={`${issue.id}-board-checkbox`} containerClassName="mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-custom-text-100 line-clamp-2 leading-snug">{issue.name}</p>
          </div>
        </div>
        <button
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-custom-background-90 rounded",
            {
              "opacity-100": isHovered,
            }
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="size-3.5 text-custom-text-300" />
        </button>
      </div>

      {/* Footer with metadata */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Issue Type & Key */}
          <div className="flex items-center gap-1.5">
            <TypeIcon className="size-3.5 text-custom-text-300" />
            <span className="font-medium text-custom-text-300">{issueKey}</span>
          </div>

          {/* Priority */}
          <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded", priorityConfig.bg)}>
            <PriorityIcon className={cn("size-3", priorityConfig.color)} />
          </div>
        </div>

        {/* Due Date */}
        {issue.targetDate ? (
          <div className="flex items-center gap-1 text-custom-text-300">
            <CalendarDays className="size-3" />
            <span className="text-xs">{issue.targetDate}</span>
          </div>
        ) : null}
      </div>

      {/* Assignees */}
      {issue.assignees && issue.assignees.length > 0 ? (
        <div className="flex items-center gap-1 -space-x-2">
          {issue.assignees.slice(0, 3).map((assignee, index) => (
            <div
              key={assignee || index}
              className="size-6 rounded-full bg-custom-primary-100 border-2 border-custom-background-100 flex items-center justify-center text-[10px] font-medium text-white"
              title={assignee || "Assignee"}
            >
              {(assignee || "U").charAt(0).toUpperCase()}
            </div>
          ))}
          {issue.assignees.length > 3 ? (
            <div className="size-6 rounded-full bg-custom-background-80 border-2 border-custom-background-100 flex items-center justify-center text-[10px] font-medium text-custom-text-200">
              +{issue.assignees.length - 3}
            </div>
          ) : null}
        </div>
      ) : null}

      {dragPosition === "bottom" ? <div className="mt-1 -mb-2.5 h-0.5 rounded-full bg-custom-primary-100" /> : null}
    </div>
  );
};

const EmptyBoardState = () => (
  <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-custom-border-200 bg-custom-background-90 p-12">
    <div className="flex items-center justify-center size-16 rounded-full bg-custom-background-80">
      <Signal className="size-8 text-custom-text-300" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold text-custom-text-100">Chưa có sprint nào đang hoạt động</h3>
      <p className="text-sm text-custom-text-300 max-w-md">
        Hãy bắt đầu một sprint từ backlog để hiển thị bảng công việc và theo dõi tiến độ của đội ngũ.
      </p>
    </div>
    <Button variant="primary" size="md" disabled className="gap-2 mt-2">
      <Plus className="size-4" />
      Bắt đầu sprint
    </Button>
  </div>
);

const IssueDetailModal: React.FC<{
  issue: IIssue;
  isOpen: boolean;
  onClose: () => void;
  projectIdentifier?: string | null;
  locationLabel?: string | null;
  onUpdateIssue?: (issueId: string, data: Partial<IIssue>) => Promise<void>;
}> = ({ issue, isOpen, onClose, projectIdentifier, locationLabel, onUpdateIssue }) => (
  <ModalCore
    isOpen={isOpen}
    handleClose={onClose}
    position={EModalPosition.CENTER}
    width={EModalWidth.XXL}
    className="max-h-[90vh]"
  >
    <div className="max-h-[90vh] overflow-hidden flex flex-col">
      <IssueDetailPanel
        issue={issue}
        projectIdentifier={projectIdentifier}
        locationLabel={locationLabel}
        onClose={onClose}
        onUpdateIssue={onUpdateIssue}
      />
    </div>
  </ModalCore>
);
