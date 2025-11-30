"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";

import { setToast, TOAST_TYPE } from "@uts/design-system/ui";
import { useIssue } from "@/core/hooks/store/use-issue";
import { useIssueStatus } from "@/core/hooks/store/use-issue-status";
import { useSprint } from "@/core/hooks/store/use-sprint";
import { useProject } from "@/core/hooks/store/use-project";
import { BoardView } from "./board-view";

export const KanbanLayout = observer(() => {
  const params = useParams<{ workspaceSlug?: string | string[]; projectId?: string | string[] }>();
  const projectIdParam = params?.projectId;
  const workspaceSlugParam = params?.workspaceSlug;

  const projectId = Array.isArray(projectIdParam) ? (projectIdParam[0] ?? "") : (projectIdParam ?? "");
  const workspaceSlug = Array.isArray(workspaceSlugParam) ? (workspaceSlugParam[0] ?? "") : (workspaceSlugParam ?? "");

  const issueStore = useIssue();
  const issueStatusStore = useIssueStatus();
  const sprintStore = useSprint();
  const projectStore = useProject();

  useEffect(() => {
    if (!projectId) return;

    issueStore
      .fetchIssuesByProject(projectId)
      .catch(() => setToast({ type: TOAST_TYPE.ERROR, title: "Lỗi", message: "Không thể tải danh sách công việc" }));
    sprintStore
      .fetchSprintsByProject(projectId)
      .catch(() => setToast({ type: TOAST_TYPE.ERROR, title: "Lỗi", message: "Không thể tải danh sách sprint" }));
    issueStatusStore
      .fetchIssueStatusesByProject(projectId)
      .catch(() => setToast({ type: TOAST_TYPE.ERROR, title: "Lỗi", message: "Không thể tải danh sách trạng thái" }));
  }, [issueStore, issueStatusStore, sprintStore, projectId]);

  // Removed useMemo to allow MobX observer to properly track changes
  const sprints = sprintStore.getSprintsForProject(projectId);
  const activeSprints = sprints.filter((sprint) => sprint.status === "ACTIVE");

  // Removed useMemo to allow MobX observer to properly track changes
  const activeSprintIds = new Set(activeSprints.map((sprint) => sprint.id));
  const issues = issueStore
    .getIssuesForProject(projectId)
    .filter((issue) => issue.sprintId && activeSprintIds.has(issue.sprintId));

  const project = projectId ? projectStore.getPartialProjectById(projectId) : undefined;
  const issueStatuses = issueStatusStore.getIssueStatusesForProject(projectId);

  return (
    <BoardView
      projectId={projectId}
      issues={issues}
      activeSprints={activeSprints}
      issueStore={issueStore}
      issueStatuses={issueStatuses}
      projectIdentifier={project?.identifier ?? null}
      workspaceSlug={workspaceSlug}
    />
  );
});
