"use client";

import { ProjectsProvider } from "@/core/contexts/projects-context";
import { ProjectAppSidebar } from "./_sidebar";
import { AppHeader } from "@/core/components/header";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectsProvider>
      <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
        <div id="full-screen-portal" className="inset-0 absolute w-full" />
        <div className="relative flex size-full overflow-hidden">
          <ProjectAppSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            <AppHeader />
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProjectsProvider>
  );
}
