import React, { useMemo, useEffect } from "react";
import { FolderKanban, ChevronDown, Plus, Home } from "lucide-react";
import { CustomSelect } from "../dropdowns/custom-select";
import { useProjects } from "./hooks/use-projects";
import type { ProjectSelectorProps } from "./types";

const PROJECT_ID_STORAGE_KEY = "project_id";

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  currentProjectId,
  workspaceId,
  workspaceSlug,
  onProjectChange,
  onCreateProject,
  apiBaseUrl,
}) => {
  const { data: projects, isLoading } = useProjects({ workspaceId, apiBaseUrl });

  // Track selected project locally for immediate UI update
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);

  // Load saved project ID from localStorage
  const savedProjectId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(PROJECT_ID_STORAGE_KEY);
  }, []);

  // Find current project by:
  // 1. selectedProjectId (local state - for immediate update)
  // 2. currentProjectId prop
  // 3. savedProjectId from localStorage
  // 4. Default to null (no selection)
  const currentProject = useMemo(() => {
    if (!projects || projects.length === 0) return null;

    const projectId = selectedProjectId || currentProjectId || savedProjectId;
    return projects.find((p) => p.id === projectId) || null;
  }, [projects, selectedProjectId, currentProjectId, savedProjectId]);

  // Get other projects (exclude current)
  const otherProjects = useMemo(() => {
    if (!projects) return [];
    if (!currentProject) return projects;
    return projects.filter((p) => p.id !== currentProject.id);
  }, [projects, currentProject]);

  // Sync selectedProjectId with currentProjectId prop when it changes
  useEffect(() => {
    if (currentProjectId !== undefined) {
      setSelectedProjectId(currentProjectId || null);
    }
  }, [currentProjectId]);

  // Save to localStorage when project changes
  useEffect(() => {
    if (currentProject?.id && typeof window !== "undefined") {
      localStorage.setItem(PROJECT_ID_STORAGE_KEY, currentProject.id);
    }
  }, [currentProject?.id]);

  const handleProjectSelect = (project: any) => {
    // Update local state immediately for instant UI update
    setSelectedProjectId(project.id);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(PROJECT_ID_STORAGE_KEY, project.id);
    }

    if (onProjectChange) {
      // Custom handler provided by parent
      onProjectChange(project);
    } else {
      // Default behavior: navigate to project board
      window.location.href = `/project/${project.id}/board`;
    }
  };

  const handleHomeSelect = () => {
    // Update local state immediately for instant UI update
    setSelectedProjectId(null);

    // Clear project selection from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(PROJECT_ID_STORAGE_KEY);
    }

    if (onProjectChange) {
      // Custom handler with null project to indicate "Home"
      onProjectChange(null);
    } else {
      // Default behavior: navigate to home
      window.location.href = `/`;
    }
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
        <span>Loading...</span>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <button
        type="button"
        onClick={handleCreateProject}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-custom-text-300 rounded-md hover:bg-custom-background-80 transition-colors"
      >
        <FolderKanban className="h-4 w-4" />
        <span>Create project</span>
      </button>
    );
  }

  return (
    <CustomSelect
      value={currentProject}
      onChange={handleProjectSelect}
      customButton={
        <div className="flex items-center gap-2 px-3 py-1.5">
          <FolderKanban className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate max-w-[150px]">{currentProject?.name || "Select project"}</span>
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
          <span className="font-medium text-sm">Home</span>
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

      {/* Create Project Button */}
      <div className="border-t border-custom-border-200 p-2">
        <button
          type="button"
          onClick={handleCreateProject}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-custom-text-200 hover:bg-custom-background-80 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create project</span>
        </button>
      </div>
    </CustomSelect>
  );
};
