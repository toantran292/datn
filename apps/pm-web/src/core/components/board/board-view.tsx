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
import type { IIssueStatus } from "@/core/types/issue-status";
import type { ISprint } from "@/core/types/sprint";
import { formatIssueKey } from "@/core/components/backlog/utils";
import { CreateStatusModal } from "@/core/components/issue-status";
import { useIssueStatus } from "@/core/hooks/store/use-issue-status";

const IssueDetailPanel = dynamic(
  () => import("@/core/components/issue/issue-detail-panel").then((mod) => mod.IssueDetailPanel),
  { ssr: false }
);

type BoardViewProps = {
  projectId: string;
  issues: IIssue[];
  activeSprints: ISprint[];
  issueStore: IIssueStore;
  issueStatuses: IIssueStatus[];
  projectIdentifier?: string | null;
  workspaceSlug?: string | null;
};

export const BoardView = memo(function BoardView({
  projectId,
  issues,
  activeSprints,
  issueStore,
  issueStatuses,
  projectIdentifier,
  workspaceSlug,
}: BoardViewProps) {
  const issueStatusStore = useIssueStatus();

  const grouped = useMemo(() => {
    const map: Record<string, IIssue[]> = {};

    // Initialize map with all status IDs
    issueStatuses.forEach((status) => {
      map[status.id] = [];
    });

    // Group issues by statusId
    issues.forEach((issue) => {
      if (map[issue.statusId]) {
        map[issue.statusId].push(issue);
      }
    });

    // Sort issues within each status
    Object.keys(map).forEach((statusId) => {
      map[statusId].sort((a, b) => {
        const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return a.createdAt.localeCompare(b.createdAt);
      });
    });

    return map;
  }, [issues, issueStatuses]);

  const [newIssueName, setNewIssueName] = useState("");
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isCreateStatusModalOpen, setIsCreateStatusModalOpen] = useState(false);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<{ statusId: string; position: "before" | "after" } | null>(null);

  // Get first status ID for quick create (usually "TO DO")
  const firstStatusId = issueStatuses.length > 0 ? issueStatuses[0].id : null;
  const selectedIssue = selectedIssueId ? (issueStore.getIssueById(selectedIssueId) ?? null) : null;
  const locationLabel = activeSprints.length > 0 ? activeSprints[0].name : null;

  useEffect(() => {
    if (selectedIssueId && !issueStore.getIssueById(selectedIssueId)) {
      setSelectedIssueId(null);
    }
  }, [selectedIssueId, issueStore, issues.length]);

  const handleQuickCreate = async () => {
    if (activeSprints.length === 0) {
      setToast({ type: TOAST_TYPE.INFO, title: "Thông báo", message: "Vui lòng bắt đầu sprint trước." });
      return;
    }

    if (!firstStatusId) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Lỗi", message: "Không tìm thấy trạng thái để tạo công việc." });
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
        sprintId: activeSprints[0].id,
        parentId: null,
        name: trimmed,
        description: null,
        descriptionHtml: null,
        priority: "MEDIUM",
        type: "TASK",
        point: null,
        sequenceId: null,
        sortOrder: null,
        startDate: null,
        targetDate: null,
        assignees: [],
      } as any);
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
    async (statusId: string, destinationIssueId: string | null, position: "before" | "after" | "end") => {
      if (!draggedIssueId || activeSprints.length === 0) return;
      const issue = issueStore.getIssueById(draggedIssueId);
      if (!issue) return;

      try {
        let latestIssue = issue;
        if (issue.statusId !== statusId) {
          await issueStore.updateIssue(draggedIssueId, { statusId });
          latestIssue = issueStore.getIssueById(draggedIssueId) ?? issue;
        }

        await issueStore.reorderIssue(projectId, {
          issueId: draggedIssueId,
          fromSectionId: latestIssue.sprintId,
          toSectionId: latestIssue.sprintId,
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
    [draggedIssueId, issueStore, projectId, activeSprints]
  );

  const handleColumnDragEnter = useCallback((statusId: string) => {
    setActiveColumn(statusId);
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

  const handleCreateStatus = useCallback(
    async (data: { name: string; description: string; color: string }) => {
      try {
        await issueStatusStore.createIssueStatus(projectId, {
          projectId,
          name: data.name,
          description: data.description,
          color: data.color,
        });
      } catch (error) {
        throw error;
      }
    },
    [issueStatusStore, projectId]
  );

  const handleColumnDrop = useCallback(
    async (targetStatusId: string, position: "before" | "after") => {
      if (!draggedColumnId || draggedColumnId === targetStatusId) {
        setDraggedColumnId(null);
        setDropPosition(null);
        return;
      }

      try {
        // Create new order array
        const currentOrder = [...issueStatuses];
        const draggedIndex = currentOrder.findIndex((s) => s.id === draggedColumnId);
        const targetIndex = currentOrder.findIndex((s) => s.id === targetStatusId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Remove dragged item
        const [draggedItem] = currentOrder.splice(draggedIndex, 1);

        // Calculate new position
        let newIndex = targetIndex;
        if (position === "after") {
          newIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
        } else {
          newIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
        }

        // Insert at new position
        currentOrder.splice(newIndex, 0, draggedItem);

        // Create array of status IDs in new order
        const newStatusIds = currentOrder.map((s) => s.id);

        // Call API to update order
        await issueStatusStore.reorderIssueStatuses(projectId, newStatusIds);

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Đã cập nhật",
          message: "Thứ tự trạng thái đã được lưu",
        });
      } catch (error: any) {
        const message =
          error?.response?.data?.message ?? error?.message ?? "Không thể sắp xếp lại trạng thái. Vui lòng thử lại.";
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi",
          message: typeof message === "string" ? message : undefined,
        });
      } finally {
        setDraggedColumnId(null);
        setDropPosition(null);
      }
    },
    [draggedColumnId, issueStatuses, issueStatusStore, projectId]
  );

  // Group issues by sprint for issue count
  const issuesBySprintId = useMemo(() => {
    const map = new Map<string, number>();
    issues.forEach((issue) => {
      if (issue.sprintId) {
        map.set(issue.sprintId, (map.get(issue.sprintId) || 0) + 1);
      }
    });
    return map;
  }, [issues]);

  if (activeSprints.length === 0) {
    return <EmptyBoardState />;
  }

  return (
    <>
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        <div className="flex-shrink-0">
          <BoardToolbar />
        </div>
        <div className="flex-shrink-0 flex flex-col gap-4 max-h-[40vh] overflow-y-auto">
          {activeSprints.map((sprint) => (
            <SprintSummary key={sprint.id} sprint={sprint} issueCount={issuesBySprintId.get(sprint.id) || 0} />
          ))}
        </div>
        <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-4 pt-2 min-h-0">
          {issueStatuses.map((status, index) => (
            <BoardColumn
              key={status.id}
              statusId={status.id}
              title={status.name}
              color={status.color}
              issues={grouped[status.id] || []}
              allowQuickCreate={index === 0}
              quickIssueName={newIssueName}
              onQuickIssueNameChange={setNewIssueName}
              onQuickCreate={handleQuickCreate}
              isCreatingIssue={isCreatingIssue}
              onIssueDrop={handleDropOnColumn}
              onIssueDragStart={(issueId) => {
                setDraggedIssueId(issueId);
                setActiveColumn(status.id);
              }}
              onIssueDragEnd={() => {
                setDraggedIssueId(null);
                setActiveColumn(null);
              }}
              isActive={activeColumn === status.id}
              onColumnDragEnter={handleColumnDragEnter}
              onIssueClick={setSelectedIssueId}
              projectIdentifier={projectIdentifier}
              isDraggingColumn={draggedColumnId !== null}
              isBeingDragged={draggedColumnId === status.id}
              dropPosition={dropPosition?.statusId === status.id ? dropPosition.position : null}
              onColumnDragStart={() => setDraggedColumnId(status.id)}
              onColumnDragEnd={() => {
                setDraggedColumnId(null);
                setDropPosition(null);
              }}
              onColumnDragOver={(position) => setDropPosition({ statusId: status.id, position })}
              onColumnDrop={handleColumnDrop}
            />
          ))}

          {/* Add Status Button */}
          <button
            onClick={() => setIsCreateStatusModalOpen(true)}
            className="flex h-full w-80 min-w-[20rem] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-custom-border-200 bg-custom-background-90/30 text-custom-text-300 transition-all hover:border-custom-primary-100 hover:bg-custom-background-90 hover:text-custom-primary-100"
          >
            <Plus className="size-8" />
            <span className="text-sm font-medium">Thêm trạng thái</span>
          </button>
        </div>
      </div>

      {selectedIssue ? (
        <IssueDetailModal
          issue={selectedIssue}
          isOpen
          onClose={handleCloseDetail}
          projectIdentifier={projectIdentifier}
          locationLabel={locationLabel}
          workspaceSlug={workspaceSlug}
          onUpdateIssue={handleUpdateIssue}
        />
      ) : null}

      <CreateStatusModal
        isOpen={isCreateStatusModalOpen}
        onClose={() => setIsCreateStatusModalOpen(false)}
        onSubmit={handleCreateStatus}
      />
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return { label: "Đang hoạt động", variant: "primary" as const };
      case "FUTURE":
        return { label: "Sắp diễn ra", variant: "outline-neutral" as const };
      case "CLOSED":
        return { label: "Đã đóng", variant: "outline-neutral" as const };
      default:
        return { label: "Chưa xác định", variant: "outline-neutral" as const };
    }
  };

  const progress = calculateProgress();
  const statusBadge = getStatusBadge(sprint.status);

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
              <Badge variant={statusBadge.variant} size="sm">
                {statusBadge.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-custom-text-300">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                <span>
                  {sprint.startDate && sprint.endDate
                    ? `${formatDate(sprint.startDate)} → ${formatDate(sprint.endDate)}`
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
  statusId: string;
  title: string;
  color: string;
  issues: IIssue[];
  allowQuickCreate: boolean;
  quickIssueName: string;
  onQuickIssueNameChange: (value: string) => void;
  onQuickCreate: () => void;
  isCreatingIssue: boolean;
  onIssueDrop: (statusId: string, destinationIssueId: string | null, position: "before" | "after" | "end") => void;
  onIssueDragStart: (issueId: string, statusId: string) => void;
  onIssueDragEnd: () => void;
  isActive: boolean;
  onColumnDragEnter: (statusId: string) => void;
  onIssueClick?: (issueId: string) => void;
  projectIdentifier?: string | null;
  isDraggingColumn: boolean;
  isBeingDragged: boolean;
  dropPosition: "before" | "after" | null;
  onColumnDragStart: () => void;
  onColumnDragEnd: () => void;
  onColumnDragOver: (position: "before" | "after") => void;
  onColumnDrop: (statusId: string, position: "before" | "after") => void;
}> = ({
  statusId,
  title,
  color,
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
  isDraggingColumn,
  isBeingDragged,
  dropPosition,
  onColumnDragStart,
  onColumnDragEnd,
  onColumnDragOver,
  onColumnDrop,
}) => {
  const [hoveredIssueId, setHoveredIssueId] = useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<"top" | "bottom" | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  return (
    <div
      className={cn(
        "flex h-full w-80 min-w-[20rem] flex-col gap-3 rounded-lg border border-custom-border-200 bg-custom-background-90/50 shadow-sm transition-all relative",
        "border-t-4",
        {
          "ring-2 ring-custom-primary-100 bg-custom-background-90": isActive,
          "opacity-50": isBeingDragged,
        }
      )}
      style={{ borderTopColor: color }}
      onDragOver={(event) => {
        if (!isDraggingColumn) {
          event.preventDefault();
          onColumnDragEnter(statusId);
          return;
        }

        // Column drag over
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        const position = event.clientX < midpoint ? "before" : "after";
        onColumnDragOver(position);
      }}
      onDrop={(event) => {
        event.preventDefault();

        if (isDraggingColumn && dropPosition) {
          onColumnDrop(statusId, dropPosition);
        } else {
          setHoveredIssueId(null);
          setHoveredPosition(null);
          onIssueDrop(statusId, null, "end");
        }
      }}
    >
      {/* Drop indicator for column reorder */}
      {dropPosition === "before" && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-custom-primary-100 z-10 rounded-l-lg" />
      )}
      {dropPosition === "after" && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-custom-primary-100 z-10 rounded-r-lg" />
      )}

      {/* Column Header */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-2 cursor-grab active:cursor-grabbing"
        draggable={!isDraggingColumn}
        onDragStart={(e) => {
          e.stopPropagation();
          onColumnDragStart();
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          onColumnDragEnd();
        }}
      >
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
            onDragStart={() => onIssueDragStart(issue.id, statusId)}
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
              onIssueDrop(statusId, issue.id, position);
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
  workspaceSlug?: string | null;
  onUpdateIssue?: (issueId: string, data: Partial<IIssue>) => Promise<void>;
}> = ({ issue, isOpen, onClose, projectIdentifier, locationLabel, workspaceSlug, onUpdateIssue }) => (
  <ModalCore
    isOpen={isOpen}
    handleClose={onClose}
    position={EModalPosition.CENTER}
    width={EModalWidth.XXXL}
    className="max-h-[90vh]"
  >
    <div className="max-h-[90vh] overflow-hidden flex flex-col w-full">
      <IssueDetailPanel
        issue={issue}
        projectIdentifier={projectIdentifier}
        locationLabel={locationLabel}
        workspaceSlug={workspaceSlug}
        onClose={onClose}
        onUpdateIssue={onUpdateIssue}
      />
    </div>
  </ModalCore>
);
