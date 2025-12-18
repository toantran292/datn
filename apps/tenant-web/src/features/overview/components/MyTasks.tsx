import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListTodo, Bug, BookOpen, Layers, CheckSquare, AlertCircle, Clock, Calendar } from "lucide-react";
import type { MyTask } from "../hooks/useMyTasks";

interface MyTasksProps {
  tasks?: MyTask[];
  isLoading?: boolean;
  onTaskClick?: (task: MyTask) => void;
}

const typeIcons: Record<string, typeof ListTodo> = {
  STORY: BookOpen,
  TASK: CheckSquare,
  BUG: Bug,
  EPIC: Layers,
  SUBTASK: ListTodo,
};

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  URGENT: { color: "#DC2626", bg: "#FEE2E2", label: "Khẩn cấp" },
  HIGH: { color: "#EA580C", bg: "#FFEDD5", label: "Cao" },
  MEDIUM: { color: "#CA8A04", bg: "#FEF9C3", label: "Trung bình" },
  LOW: { color: "#16A34A", bg: "#DCFCE7", label: "Thấp" },
  NONE: { color: "#6B7280", bg: "#F3F4F6", label: "Không" },
};

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hôm nay";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Ngày mai";
  }

  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffDays < 0) {
    return `Quá hạn ${Math.abs(diffDays)} ngày`;
  }
  if (diffDays <= 7) {
    return `Còn ${diffDays} ngày`;
  }

  return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
}

function isOverdue(dateString?: string): boolean {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

export function MyTasks({ tasks = [], isLoading = false, onTaskClick }: MyTasksProps) {
  if (isLoading) {
    return (
      <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
        <div className="mb-6">
          <h3 style={{ fontWeight: 600 }}>Công việc của tôi</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Công việc được giao cho bạn
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
        <div className="mb-6">
          <h3 style={{ fontWeight: 600 }}>Công việc của tôi</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Công việc được giao cho bạn
          </p>
        </div>
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
            <CheckSquare size={28} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Chưa có công việc nào</p>
          <p className="text-sm text-muted-foreground mt-1">
            Bạn đã hoàn thành tất cả!
          </p>
        </div>
      </Card>
    );
  }

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    const statusName = task.status?.name || "Unknown";
    if (!acc[statusName]) {
      acc[statusName] = [];
    }
    acc[statusName].push(task);
    return acc;
  }, {} as Record<string, MyTask[]>);

  // Sort statuses: In Progress first, then To Do, then others
  const statusOrder = ["IN PROGRESS", "TO DO", "IN REVIEW"];
  const sortedStatuses = Object.keys(tasksByStatus).sort((a, b) => {
    const aIndex = statusOrder.indexOf(a.toUpperCase());
    const bIndex = statusOrder.indexOf(b.toUpperCase());
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 style={{ fontWeight: 600 }}>Công việc của tôi</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.length} công việc được giao cho bạn
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {tasks.filter(t => t.status?.name?.toUpperCase() !== "DONE").length} đang mở
          </Badge>
        </div>
      </div>

      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
        {sortedStatuses.map((status) => {
          const statusTasks = tasksByStatus[status];
          const statusColor = statusTasks[0]?.status?.color || "#6B7280";

          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {status}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({statusTasks.length})
                </span>
              </div>

              <div className="space-y-2">
                {statusTasks.map((task) => {
                  const TypeIcon = typeIcons[task.type] || ListTodo;
                  const priority = priorityConfig[task.priority] || priorityConfig.NONE;
                  const overdue = isOverdue(task.targetDate);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer group"
                    >
                      <div
                        className="p-1.5 rounded-lg mt-0.5"
                        style={{ backgroundColor: priority.bg }}
                      >
                        <TypeIcon size={16} style={{ color: priority.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-muted-foreground font-mono">
                            {task.project?.identifier}-{task.sequenceId}
                          </span>
                          {task.priority !== "NONE" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                              style={{
                                color: priority.color,
                                borderColor: priority.color,
                                backgroundColor: priority.bg,
                              }}
                            >
                              {priority.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {task.name}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {task.project && (
                            <span className="flex items-center gap-1">
                              <Layers size={12} />
                              {task.project.name}
                            </span>
                          )}
                          {task.targetDate && (
                            <span
                              className={`flex items-center gap-1 ${
                                overdue ? "text-destructive" : ""
                              }`}
                            >
                              {overdue ? (
                                <AlertCircle size={12} />
                              ) : (
                                <Calendar size={12} />
                              )}
                              {formatDate(task.targetDate)}
                            </span>
                          )}
                          {task.point && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {task.point} pts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
