"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";

import { ProjectTabs } from "@/core/components/project/project-tabs";
import { useProject } from "@/core/hooks/store/use-project";

import { KanbanLayout } from "@/core/components/board/kanban-layout";

const ProjectBoardPage = observer(() => {
  const params = useParams<{ workspaceSlug?: string | string[]; projectId?: string | string[] }>();
  const projectIdParam = params?.projectId;
  const workspaceSlugParam = params?.workspaceSlug;

  const projectId = Array.isArray(projectIdParam) ? (projectIdParam[0] ?? "") : (projectIdParam ?? "");
  const workspaceSlug = Array.isArray(workspaceSlugParam) ? (workspaceSlugParam[0] ?? "") : (workspaceSlugParam ?? "");

  const projectStore = useProject();
  const project = projectStore.getPartialProjectById(projectId);
  const projectTitle = project?.name ?? "Board";

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-custom-text-300">Dự án</p>
            <h1 className="text-2xl font-semibold text-custom-text-100">{projectTitle}</h1>
            <p className="text-sm text-custom-text-300">Trực quan hoá công việc và theo dõi tiến độ của đội ngũ.</p>
          </div>
        </div>
        <ProjectTabs workspaceSlug={workspaceSlug} projectId={projectId} active="board" />
      </header>

      <KanbanLayout />
    </div>
  );
});

export default ProjectBoardPage;
