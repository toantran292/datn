"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ProjectTabs } from "@/core/components/project/project-tabs";
import { TimelineLayout } from "@/core/components/timeline/timeline-layout";
import { useProject } from "@/core/hooks/store/use-project";

const ProjectTimelinePage = observer(() => {
  const params = useParams<{ workspaceSlug?: string | string[]; projectId?: string | string[] }>();
  const projectStore = useProject();

  const projectIdParam = params?.projectId;
  const workspaceSlugParam = params?.workspaceSlug;

  const projectId = Array.isArray(projectIdParam) ? (projectIdParam[0] ?? "") : (projectIdParam ?? "");
  const workspaceSlug = Array.isArray(workspaceSlugParam) ? (workspaceSlugParam[0] ?? "") : (workspaceSlugParam ?? "");

  const project = projectId ? projectStore.getPartialProjectById(projectId) : undefined;

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-custom-text-300">Dự án</p>
            <h1 className="text-2xl font-semibold text-custom-text-100">Timeline</h1>
            <p className="text-sm text-custom-text-300">Xem tiến độ công việc theo thời gian.</p>
          </div>
        </div>
        <ProjectTabs workspaceSlug={workspaceSlug} projectId={projectId} active="timeline" />
      </header>
      <TimelineLayout projectId={projectId} workspaceSlug={workspaceSlug} projectIdentifier={project?.identifier ?? null} />
    </div>
  );
});

export default ProjectTimelinePage;
