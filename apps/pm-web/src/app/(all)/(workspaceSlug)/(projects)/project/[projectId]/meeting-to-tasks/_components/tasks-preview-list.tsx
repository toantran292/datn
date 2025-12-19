"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, AlertCircle, CheckCircle2, Zap, BookOpen, Bug, User, Link2, Edit } from "lucide-react";
import { Button, ModalCore, EModalPosition, EModalWidth } from "@uts/design-system/ui";
import { TaskPreview, TaskType, TaskPriority } from "../types";
import ReactMarkdown from "react-markdown";
import { IssueDetailPanel } from "@/core/components/issue";
import { IIssue } from "@/core/types/issue";
import { convertTaskPreviewToIssue, convertIssueToTaskPreview } from "../utils/task-to-issue";

interface TasksPreviewListProps {
  tasks: TaskPreview[];
  onTasksChange: (tasks: TaskPreview[]) => void;
  transcript: string;
  projectId: string;
  workspaceSlug: string;
}

const TYPE_CONFIG: Record<TaskType, { icon: any; label: string; color: string; bgColor: string }> = {
  bug: {
    icon: Bug,
    label: "Bug",
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  task: {
    icon: CheckCircle2,
    label: "Task",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  story: {
    icon: BookOpen,
    label: "Story",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  feature: {
    icon: Zap,
    label: "Feature",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
  },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  urgent: {
    label: "Urgent",
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  high: {
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
  },
  low: {
    label: "Low",
    color: "text-gray-600",
    bgColor: "bg-gray-500/10",
  },
};

export function TasksPreviewList({ tasks, onTasksChange, transcript, projectId, workspaceSlug }: TasksPreviewListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showTranscript, setShowTranscript] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskPreview | null>(null);
  const [editingIssue, setEditingIssue] = useState<IIssue | null>(null);

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const removeTask = (taskId: string) => {
    onTasksChange(tasks.filter((t) => t.id !== taskId));
  };

  const handleEditTask = (task: TaskPreview) => {
    setEditingTask(task);
    // Convert task to temporary IIssue object
    const tempIssue = convertTaskPreviewToIssue(task, projectId);
    setEditingIssue(tempIssue);
  };

  const handleUpdateIssue = async (issueId: string, data: Partial<IIssue>) => {
    if (!editingIssue || !editingTask) return;

    // Update the temporary issue object
    const updatedIssue = { ...editingIssue, ...data };
    setEditingIssue(updatedIssue);

    // Convert back to TaskPreview and update the tasks list
    const updatedTask = convertIssueToTaskPreview(updatedIssue, editingTask);
    onTasksChange(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleCloseEditor = () => {
    setEditingTask(null);
    setEditingIssue(null);
  };

  return (
    <div className="space-y-3">
      {/* Transcript Collapsible */}
      <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 overflow-hidden">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full flex items-center justify-between p-4 hover:bg-custom-background-90 transition-colors"
        >
          <span className="text-sm font-medium text-custom-text-200">
            {showTranscript ? "Ẩn" : "Xem"} Meeting Transcript
          </span>
          {showTranscript ? (
            <ChevronUp className="size-4 text-custom-text-300" />
          ) : (
            <ChevronDown className="size-4 text-custom-text-300" />
          )}
        </button>
        {showTranscript && (
          <div className="border-t border-custom-border-200 p-4 bg-custom-background-90">
            <div className="max-h-60 overflow-y-auto text-sm text-custom-text-300 whitespace-pre-wrap font-mono">
              {transcript}
            </div>
          </div>
        )}
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-8 text-center">
          <AlertCircle className="size-12 mx-auto mb-3 text-custom-text-400" />
          <p className="text-sm text-custom-text-300">Không có tasks nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks
            .sort((a, b) => a.order - b.order)
            .map((task) => {
              const isExpanded = expandedTasks.has(task.id);
              const typeConfig = TYPE_CONFIG[task.type];
              const priorityConfig = PRIORITY_CONFIG[task.priority];
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={task.id}
                  className="rounded-lg border border-custom-border-200 bg-custom-background-100 overflow-hidden hover:border-custom-border-300 transition-colors"
                >
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Order Badge */}
                      <div className="flex-shrink-0 flex items-center justify-center size-8 rounded-lg bg-custom-background-90 border border-custom-border-200">
                        <span className="text-sm font-semibold text-custom-text-300">#{task.order}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {/* Type Tag */}
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                            <TypeIcon className="size-3" />
                            {typeConfig.label}
                          </span>

                          {/* Priority Tag */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>

                          {/* Story Points */}
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-custom-primary-100/10 text-custom-primary-100">
                            {task.estimatedPoints} points
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-semibold text-custom-text-100 mb-2 leading-snug">
                          {task.title}
                        </h3>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-custom-text-300">
                          {task.suggestedAssignee && (
                            <div className="flex items-center gap-1.5">
                              <User className="size-3" />
                              <span>{task.suggestedAssignee}</span>
                            </div>
                          )}
                          {task.dependencies.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Link2 className="size-3" />
                              <span>Phụ thuộc: #{task.dependencies.join(", #")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-2 rounded-md hover:bg-custom-primary-100/10 text-custom-text-300 hover:text-custom-primary-100 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="size-4" />
                        </button>
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="p-2 rounded-md hover:bg-custom-background-90 text-custom-text-300 hover:text-custom-text-200 transition-colors"
                          title={isExpanded ? "Thu gọn" : "Xem chi tiết"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="p-2 rounded-md hover:bg-red-500/10 text-custom-text-300 hover:text-red-600 transition-colors"
                          title="Xóa task"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-custom-border-200 bg-custom-background-90 p-4 space-y-4">
                      {/* Description */}
                      <div>
                        <h4 className="text-sm font-semibold text-custom-text-200 mb-2">Mô tả chi tiết</h4>
                        <div className="prose prose-sm max-w-none text-custom-text-300 bg-custom-background-100 rounded-lg p-3 border border-custom-border-200">
                          <ReactMarkdown>{task.description}</ReactMarkdown>
                        </div>
                      </div>

                      {/* Context */}
                      {task.context && (
                        <div>
                          <h4 className="text-sm font-semibold text-custom-text-200 mb-2">Ngữ cảnh từ meeting</h4>
                          <div className="text-sm text-custom-text-300 bg-custom-primary-100/5 border border-custom-primary-100/20 rounded-lg p-3">
                            {task.context}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Edit Modal with IssueDetailPanel */}
      {editingTask && editingIssue && (
        <ModalCore
          isOpen={true}
          handleClose={handleCloseEditor}
          position={EModalPosition.CENTER}
          width={EModalWidth.XXXL}
          className="max-h-[90vh]"
        >
          <div className="max-h-[90vh] overflow-hidden flex flex-col w-full">
            <IssueDetailPanel
              issue={editingIssue}
              projectIdentifier={null}
              locationLabel="Meeting to Tasks Preview"
              workspaceSlug={workspaceSlug}
              onClose={handleCloseEditor}
              onUpdateIssue={handleUpdateIssue}
            />
          </div>
        </ModalCore>
      )}
    </div>
  );
}
