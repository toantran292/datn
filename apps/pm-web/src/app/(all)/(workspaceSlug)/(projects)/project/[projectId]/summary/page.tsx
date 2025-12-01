"use client";

import { useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { setToast, TOAST_TYPE } from "@uts/design-system/ui";

import { useProject } from "@/core/hooks/store/use-project";
import { useIssueStatus } from "@/core/hooks/store/use-issue-status";
import { ProjectTabs } from "@/core/components/project/project-tabs";
import { CreatedVsResolved, IssueStats } from "@/core/components/analytics";

const SummaryPage = observer(() => {
  const params = useParams<{ workspaceSlug?: string | string[]; projectId?: string | string[] }>();
  const projectIdParam = params?.projectId;
  const workspaceSlugParam = params?.workspaceSlug;
  const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] ?? "" : projectIdParam ?? "";
  const workspaceSlug = Array.isArray(workspaceSlugParam) ? workspaceSlugParam[0] ?? "" : workspaceSlugParam ?? "";

  const projectStore = useProject();
  const issueStatusStore = useIssueStatus();

  const project = projectId ? projectStore.getPartialProjectById(projectId) : undefined;

  useEffect(() => {
    if (!projectId) return;
    if (!projectStore.fetchStatus) {
      projectStore.fetchPartialProjects(workspaceSlug).catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi",
          message: "Không thể tải dự án",
        })
      );
    }
    if (issueStatusStore.getLoaderForProject(projectId) !== "loaded") {
      issueStatusStore.fetchIssueStatusesByProject(projectId).catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi",
          message: "Không thể tải trạng thái",
        })
      );
    }
  }, [issueStatusStore, projectId, projectStore, workspaceSlug]);

  if (!projectId) {
    return null;
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-custom-text-300">Dự án</p>
            <h1 className="text-2xl font-semibold text-custom-text-100">{project?.name ?? "Tổng quan"}</h1>
            <p className="text-sm text-custom-text-300">Tóm tắt tiến độ công việc trong dự án.</p>
          </div>
        </div>
        <ProjectTabs workspaceSlug={workspaceSlug} projectId={projectId} active="summary" />
      </header>

      <div className="space-y-6">
        {/* Stats Cards */}
        <IssueStats projectId={projectId} />

        {/* Created vs Resolved Chart */}
        <CreatedVsResolved projectId={projectId} />
      </div>
    </div>
  );
});

export default SummaryPage;
