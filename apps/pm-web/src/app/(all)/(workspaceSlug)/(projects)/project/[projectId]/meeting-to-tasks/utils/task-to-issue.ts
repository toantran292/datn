import { IIssue, TIssueType, TIssuePriority } from "@/core/types/issue";
import { TaskPreview, TaskType, TaskPriority } from "../types";

/**
 * Converts TaskType (from AI) to TIssueType
 */
export function mapTaskTypeToIssueType(taskType: TaskType): TIssueType {
  const mapping: Record<TaskType, TIssueType> = {
    bug: "BUG",
    task: "TASK",
    story: "STORY",
    feature: "EPIC", // Features are mapped to EPIC
  };
  return mapping[taskType];
}

/**
 * Converts TaskPriority (from AI) to TIssuePriority
 */
export function mapTaskPriorityToIssuePriority(taskPriority: TaskPriority): TIssuePriority {
  const mapping: Record<TaskPriority, TIssuePriority> = {
    urgent: "CRITICAL",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
  };
  return mapping[taskPriority];
}

/**
 * Converts TIssueType back to TaskType (for editing)
 */
export function mapIssueTypeToTaskType(issueType: TIssueType): TaskType {
  const mapping: Record<TIssueType, TaskType> = {
    BUG: TaskType.BUG,
    TASK: TaskType.TASK,
    STORY: TaskType.STORY,
    EPIC: TaskType.FEATURE,
  };
  return mapping[issueType];
}

/**
 * Converts TIssuePriority back to TaskPriority (for editing)
 */
export function mapIssuePriorityToTaskPriority(issuePriority: TIssuePriority): TaskPriority {
  const mapping: Record<TIssuePriority, TaskPriority> = {
    CRITICAL: TaskPriority.URGENT,
    HIGH: TaskPriority.HIGH,
    MEDIUM: TaskPriority.MEDIUM,
    LOW: TaskPriority.LOW,
  };
  return mapping[issuePriority];
}

/**
 * AI already returns HTML formatted description
 * This function just ensures the HTML is clean
 */
export function convertDescriptionToHtml(description: string): string {
  // AI now returns HTML directly following the universal template
  // Just return as-is since it's already properly formatted
  return description.trim();
}

/**
 * Converts a TaskPreview (from AI) to a temporary IIssue object
 * This creates a "draft" issue that can be edited using IssueDetailPanel
 */
export function convertTaskPreviewToIssue(
  task: TaskPreview,
  projectId: string,
  defaultStatusId: string = "temp-status-todo"
): IIssue {
  const now = new Date().toISOString();

  return {
    // Temporary IDs - will be replaced when created
    id: task.id,
    projectId,
    sprintId: null,
    parentId: null,
    statusId: defaultStatusId,

    // Core fields
    name: task.title,
    description: task.description,
    descriptionHtml: convertDescriptionToHtml(task.description),

    // Type and priority mapping
    type: mapTaskTypeToIssueType(task.type),
    priority: mapTaskPriorityToIssuePriority(task.priority),

    // Points and sequence
    point: task.estimatedPoints,
    sequenceId: task.order,
    sortOrder: task.order,

    // Dates
    startDate: null,
    targetDate: null,

    // Assignees (empty for now, can be set in editor)
    assignees: task.assigneeId ? [task.assigneeId] : [],

    // Deprecated state field (use statusId instead)
    state: "TODO",

    // Metadata
    createdBy: "temp-user",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Converts an edited IIssue back to TaskPreview format
 * This is used when saving changes from IssueDetailPanel
 */
export function convertIssueToTaskPreview(
  issue: IIssue,
  originalTask: TaskPreview
): TaskPreview {
  return {
    id: issue.id,
    title: issue.name,
    // Prefer descriptionHtml if available (from editor), fallback to description
    description: issue.descriptionHtml || issue.description || "",
    type: mapIssueTypeToTaskType(issue.type),
    priority: mapIssuePriorityToTaskPriority(issue.priority),
    order: issue.sequenceId,
    estimatedPoints: issue.point || 1,
    suggestedAssignee: originalTask.suggestedAssignee, // Keep original suggestion
    assigneeId: issue.assignees[0] || undefined,
    dependencies: originalTask.dependencies, // Keep original dependencies
    context: originalTask.context, // Keep original context
  };
}
