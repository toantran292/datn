"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";

import { CalendarLayout } from "@/core/components/calendar/calendar-layout";
import { ProjectTabs } from "@/core/components/project/project-tabs";
import { useProject } from "@/core/hooks/store/use-project";

const ProjectCalendarPage = observer(() => {
  const params = useParams<{ workspaceSlug?: string | string[]; projectId?: string | string[] }>();
  const projectIdParam = params?.projectId;
  const workspaceSlugParam = params?.workspaceSlug;

  const projectId = Array.isArray(projectIdParam) ? (projectIdParam[0] ?? "") : (projectIdParam ?? "");
  const workspaceSlug = Array.isArray(workspaceSlugParam) ? (workspaceSlugParam[0] ?? "") : (workspaceSlugParam ?? "");

  const projectStore = useProject();
  const project = projectStore.getPartialProjectById(projectId);
  const projectTitle = project?.name ?? "Calendar";

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-custom-text-300">Dự án</p>
            <h1 className="text-2xl font-semibold text-custom-text-100">{projectTitle}</h1>
            <p className="text-sm text-custom-text-300">Xem công việc theo lịch và quản lý thời gian.</p>
          </div>
        </div>
        <ProjectTabs workspaceSlug={workspaceSlug} projectId={projectId} active="calendar" />
      </header>

      <CalendarLayout projectId={projectId} />
    </div>
  );
});

export default ProjectCalendarPage;
