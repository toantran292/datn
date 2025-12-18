"use client";

import { AppHeader } from "@uts/design-system/ui";
import { SearchModal } from "@/core/components/search/search-modal";
import { SearchTrigger } from "@/core/components/search/search-trigger";
import { ProjectsProvider } from "@/core/contexts/projects-context";
import { SidebarProvider } from "@/core/contexts/sidebar-context";
import { useSearchShortcut } from "@/core/hooks/use-search-shortcut";
import { ProjectAppSidebar } from "./_sidebar";

function WorkspaceLayoutContent({ children }: { children: React.ReactNode }) {
  // Enable global search keyboard shortcut (Cmd/Ctrl+K)
  useSearchShortcut();

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
      <div id="full-screen-portal" className="inset-0 absolute w-full pointer-events-none" />
      {/* Header full width */}
      <AppHeader
        className="z-[9999]"
        searchTrigger={<SearchTrigger />}
        // showMenuToggle={!!currentProjectId} onMenuToggle={toggleSidebar} className="z-[9999]"
      />
      <div className="relative flex size-full overflow-hidden">
        <ProjectAppSidebar />
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
          <div className="flex-1 overflow-hidden">{children}</div>
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal />
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
