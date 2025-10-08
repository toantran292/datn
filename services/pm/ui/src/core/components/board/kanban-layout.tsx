"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";

import { BoardView } from "./board-view";
import { useIssue } from "@/core/hooks/store/use-issue";
import { useSprint } from "@/core/hooks/store/use-sprint";
import { setToast, TOAST_TYPE } from "@uts/design-system/ui";

export const KanbanLayout = observer(() => {
  const params = useParams<{ workspaceSlug?: string | string[]; projectId?: string | string[] }>();
  const projectIdParam = params?.projectId;

  const projectId = Array.isArray(projectIdParam) ? (projectIdParam[0] ?? "") : (projectIdParam ?? "");

  const issueStore = useIssue();
  const sprintStore = useSprint();

  useEffect(() => {
    if (!projectId) return;

    issueStore
      .fetchIssuesByProject(projectId)
      .catch(() => setToast({ type: TOAST_TYPE.ERROR, title: "Lỗi", message: "Không thể tải danh sách công việc" }));
    sprintStore
      .fetchSprintsByProject(projectId)
      .catch(() => setToast({ type: TOAST_TYPE.ERROR, title: "Lỗi", message: "Không thể tải danh sách sprint" }));
  }, [issueStore, sprintStore, projectId]);

  // Removed useMemo to allow MobX observer to properly track changes
  const sprints = sprintStore.getSprintsForProject(projectId);
  const today = new Date().toISOString().slice(0, 10);
  const activeSprint = sprints.length
    ? (sprints.find((sprint) => sprint.startDate && (!sprint.endDate || sprint.endDate >= today)) ??
      sprints.find((sprint) => sprint.startDate) ??
      sprints[0])
    : undefined;

  // Removed useMemo to allow MobX observer to properly track changes
  const issues = activeSprint
    ? issueStore.getIssuesForProject(projectId).filter((issue) => issue.sprintId === activeSprint.id)
    : [];

  return <BoardView projectId={projectId} issues={issues} sprint={activeSprint} issueStore={issueStore} />;
});
