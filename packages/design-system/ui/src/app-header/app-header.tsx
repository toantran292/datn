"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Header, EHeaderVariant } from "../header";
import { WorkspaceSelector } from "./workspace-selector";
import { ProjectSelector } from "./project-selector";
import { ProductSwitcher } from "./product-switcher";
import { CreateProjectModal } from "./create-project-modal";
import { projectKeys } from "./hooks/use-projects";
import type { AppHeaderProps } from "./types";
import { cn } from "../utils";
import { UserMenu } from "./user-menu";
import { useAppHeaderContext } from "./hooks/app-header-provider";

// UTS Brand Logo Component
const UTSLogo: React.FC = () => (
  <div className="size-6 bg-gradient-to-br from-[#FF8800] to-[#00C4AB] rounded-md flex items-center justify-center shadow-lg">
    <svg className="w-4 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  </div>
);

export const AppHeader: React.FC<AppHeaderProps> = ({ className }) => {
  const {
    currentApp,
    workspaceSlug,
    currentWorkspaceId,
    apiBaseUrl,
    authWebUrl,
  } = useAppHeaderContext();

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleOpenCreateProject = () => {
    // Luôn dùng modal tạo project mặc định của lib
    setIsCreateProjectModalOpen(true);
  };

  const handleCreateProjectSuccess = () => {
    // Invalidate projects query to refetch
    queryClient.invalidateQueries({ queryKey: projectKeys.list(currentWorkspaceId) });
  };

  return (
    <>
      <Header variant={EHeaderVariant.PRIMARY} className={cn("border-b border-custom-border-200 px-2", className)}>
        <Header.LeftItem>
          <UTSLogo />

          <WorkspaceSelector />

          <ProjectSelector
            onCreateProject={handleOpenCreateProject}
          />
        </Header.LeftItem>

        <Header.RightItem className="flex items-center gap-2">
          <ProductSwitcher currentApp={currentApp} workspaceSlug={workspaceSlug} />

          <UserMenu apiBaseUrl={apiBaseUrl} authWebUrl={authWebUrl} />
        </Header.RightItem>
      </Header>

      {/* Create Project Modal - Shared across all products */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        workspaceId={currentWorkspaceId || ""}
        workspaceSlug={workspaceSlug}
        apiBaseUrl={apiBaseUrl}
        onSuccess={handleCreateProjectSuccess}
      />
    </>
  );
};

AppHeader.displayName = "AppHeader";
