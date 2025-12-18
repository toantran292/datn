import React, { useMemo, useEffect } from "react";
import { FolderKanban, ChevronDown, Plus, Home } from "lucide-react";
import { CustomSelect } from "../dropdowns/custom-select";
import { useProjects } from "./hooks/use-projects";
import type { ProjectSelectorProps } from "./types";
import { useAppHeaderContext } from "./hooks/app-header-provider";

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ onCreateProject }) => {
  const { currentWorkspaceId, currentProjectId, apiBaseUrl, setProjectFromHeader, auth } = useAppHeaderContext();

  const { data: projects, isLoading } = useProjects({ workspaceId: currentWorkspaceId, apiBaseUrl });

  // Check if user is admin or owner - only they can create projects
  const isAdminOrOwner = auth?.roles?.some((role) =>
    ["ADMIN", "OWNER"].includes(role.toUpperCase())
  ) ?? false;

  // Track selected project locally cho UI, ưu tiên:
  // 1. selectedProjectId (state tại chỗ)
  // 2. currentProjectId từ context (đọc từ URL / initial)
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);

  const currentProject = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    const projectId = selectedProjectId || currentProjectId || null;
    return projects.find((p) => p.id === projectId) || null;
  }, [projects, selectedProjectId, currentProjectId]);

  // Get other projects (exclude current)
  const otherProjects = useMemo(() => {
    if (!projects) return [];
    if (!currentProject) return projects;
    return projects.filter((p) => p.id !== currentProject.id);
  }, [projects, currentProject]);

  // Sync selectedProjectId với currentProjectId trong context khi nó thay đổi
  useEffect(() => {
    if (currentProjectId !== undefined) {
      setSelectedProjectId(currentProjectId || null);
    }
  }, [currentProjectId]);

  const handleProjectSelect = (project: any) => {
    // Update local state immediately cho UI
    setSelectedProjectId(project.id);

    // Cập nhật context chung cho toàn app-header -> provider sẽ điều hướng /project/:id
    setProjectFromHeader(project);
  };

  const handleHomeSelect = () => {
    // Update local state immediately cho UI
    setSelectedProjectId(null);

    // Thông báo cho context là đang ở "Home" (không thuộc project nào) -> provider redirect về "/"
    setProjectFromHeader(null);
  };

  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-custom-text-200">
        <FolderKanban className="h-4 w-4" />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    // Only show create button if user is admin/owner
    if (isAdminOrOwner) {
      return (
        <button
          type="button"
          onClick={handleCreateProject}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-custom-text-300 rounded-md hover:bg-custom-background-80 transition-colors"
        >
          <FolderKanban className="h-4 w-4" />
          <span>Tạo project</span>
        </button>
      );
    }
    // Members see "No projects" text instead
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-custom-text-300">
        <FolderKanban className="h-4 w-4" />
        <span>Chưa có project</span>
      </div>
    );
  }

  return (
    <CustomSelect
      value={currentProject}
      onChange={handleProjectSelect}
      customButton={
        <div className="flex items-center gap-2 px-3 py-1.5">
          <FolderKanban className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate max-w-[150px]">{currentProject?.name || "Chọn project"}</span>
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
        </div>
      }
      customButtonClassName="rounded-md hover:bg-custom-background-80 transition-colors !z-[9999]"
      optionsClassName="min-w-[280px] !z-[9999] !p-0"
      maxHeight="md"
    >
      {/* Current Project Header (if project is selected) */}
      {currentProject && (
        <div className="px-4 py-3 border-b border-custom-border-200">
          <div className="flex items-center gap-3">
            {currentProject.logo_props?.in_use === "emoji" && currentProject.logo_props.emoji?.value && (
              <span className="text-2xl">{currentProject.logo_props.emoji.value}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-custom-text-100 truncate">{currentProject.name}</div>
              <div className="text-xs text-custom-text-300">{currentProject.identifier}</div>
            </div>
          </div>
        </div>
      )}

      {/* Home Option */}
      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={handleHomeSelect}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors
            ${
              !currentProject
                ? "bg-custom-background-80 text-custom-text-100"
                : "hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100"
            }
          `}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium text-sm">Trang chủ</span>
        </button>
      </div>

      {/* Projects Section */}
      {otherProjects.length > 0 && (
        <>
          <div className="px-3 py-2 pt-3">
            <div className="text-xs font-semibold text-custom-text-300 uppercase">Projects</div>
          </div>

          <div className="px-2 pb-2 max-h-[400px] overflow-y-auto">
            {otherProjects.map((project) => (
              <CustomSelect.Option key={project.id} value={project} className="!z-[9999]">
                <div className="flex items-center gap-3 w-full">
                  {project.logo_props?.in_use === "emoji" && project.logo_props.emoji?.value && (
                    <span className="text-base">{project.logo_props.emoji.value}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{project.name}</div>
                    <div className="text-xs text-custom-text-300">{project.identifier}</div>
                  </div>
                </div>
              </CustomSelect.Option>
            ))}
          </div>
        </>
      )}

      {/* Create Project Button - Only shown to Admin/Owner */}
      {isAdminOrOwner && (
        <div className="border-t border-custom-border-200 p-2">
          <button
            type="button"
            onClick={handleCreateProject}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-custom-text-200 hover:bg-custom-background-80 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo project</span>
          </button>
        </div>
      )}
    </CustomSelect>
  );
};
