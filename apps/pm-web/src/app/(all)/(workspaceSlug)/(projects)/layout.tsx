"use client";

import { useParams, useRouter } from "next/navigation";
import { ProjectsProvider } from "@/core/contexts/projects-context";
import { SidebarProvider, useSidebar } from "@/core/contexts/sidebar-context";
import { ProjectAppSidebar } from "./_sidebar";
import { AppHeader } from "@uts/design-system/ui";
import type { TPartialProject } from "@uts/types";

function WorkspaceLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams<{ workspaceSlug: string; projectId?: string }>();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  // TODO: Get current workspace ID from workspace slug
  // For now, we'll pass workspaceSlug and let the header fetch the workspaces
  const currentWorkspaceId = undefined;
  const currentProjectId = params?.projectId;

  const handleProjectChange = (project: TPartialProject | null) => {
    if (!project) {
      // Navigate to home (no project selected)
      router.push(`/`);
      return;
    }

    // Navigate to project backlog (default view for pm-web)
    router.push(`/project/${project.id}/backlog`);
  };

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
      <div id="full-screen-portal" className="inset-0 absolute w-full pointer-events-none" />
      {/* Header full width */}
      <AppHeader
        currentApp="pm"
        workspaceSlug={params.workspaceSlug}
        currentWorkspaceId={currentWorkspaceId}
        currentProjectId={currentProjectId}
        showMenuToggle
        onMenuToggle={toggleSidebar}
        onProjectChange={handleProjectChange}
        className="z-[9999]"
        apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}
        authWebUrl={process.env.NEXT_PUBLIC_AUTH_WEB_URL || "http://localhost:3000"}
      />
      <div className="relative flex size-full overflow-hidden">
        <ProjectAppSidebar />
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
          <div className="flex-1 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectsProvider>
      <SidebarProvider>
        <WorkspaceLayoutContent>{children}</WorkspaceLayoutContent>
      </SidebarProvider>
    </ProjectsProvider>
  );
}
