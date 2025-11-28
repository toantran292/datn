import React, { useMemo } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { CustomSelect } from "../dropdowns/custom-select";
import { useWorkspaces, useAuthMe } from "./hooks/use-workspaces";
import type { WorkspaceSelectorProps } from "./types";
import { cn } from "../utils";
import { Avatar } from "../avatar";

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  currentWorkspaceId,
  onWorkspaceChange,
  apiBaseUrl,
  authWebUrl,
  workspaceSlug,
}) => {
  const { data: workspaces, isLoading } = useWorkspaces({ apiBaseUrl });
  const { data: authMe } = useAuthMe({ apiBaseUrl });

  // Get org_id from API /auth/me
  const orgIdFromApi = authMe?.org_id || null;

  // Find current workspace by:
  // 1. org_id from API /auth/me (most reliable)
  // 2. currentWorkspaceId prop
  // 3. workspaceSlug prop
  // 4. Default to first workspace
  const currentWorkspace = useMemo(() => {
    if (!workspaces || workspaces.length === 0) return null;

    return (
      (orgIdFromApi && workspaces.find((w) => w.id === orgIdFromApi)) ||
      workspaces.find((w) => w.id === currentWorkspaceId) ||
      workspaces.find((w) => w.slug === workspaceSlug) ||
      workspaces[0]
    );
  }, [workspaces, orgIdFromApi, currentWorkspaceId, workspaceSlug]);

  // Get other workspaces (exclude current)
  const otherWorkspaces = useMemo(() => {
    if (!workspaces || !currentWorkspace) return [];
    return workspaces.filter((w) => w.id !== currentWorkspace.id);
  }, [workspaces, currentWorkspace]);

  const handleWorkspaceSelect = (workspace: any) => {
    if (onWorkspaceChange) {
      // Custom handler provided by parent
      onWorkspaceChange(workspace);
    } else {
      // Default behavior: redirect to auth-web /enter page
      // This follows the same pattern as workspaces page in auth-web
      const authBase = authWebUrl || process.env.NEXT_PUBLIC_AUTH_WEB_URL || "http://localhost:3000";
      window.location.href = `${authBase}/enter?org_id=${workspace.id}&slug=${workspace.slug}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-custom-text-200">
        <Building2 className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <CustomSelect
      value={currentWorkspace}
      onChange={handleWorkspaceSelect}
      customButton={
        <div className="flex items-center gap-2 px-3 py-1.5">
          <Avatar
            shape="square"
            size="sm"
            name={currentWorkspace?.display_name}
            src={currentWorkspace?.logo_url || undefined}
          />
          <span className="text-sm font-medium truncate max-w-[120px]">
            {currentWorkspace?.display_name || "Select workspace"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
        </div>
      }
      customButtonClassName="rounded-md hover:bg-custom-background-80 transition-colors !z-[9999]"
      optionsClassName="min-w-[280px] !z-[9999] !p-0"
      maxHeight="md"
    >
      {/* Current Workspace Header */}
      <div className="px-4 py-3 border-b border-custom-border-200">
        <div className="flex items-center gap-3">
          <Avatar
            shape="square"
            size="md"
            name={currentWorkspace?.display_name}
            src={currentWorkspace?.logo_url || undefined}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-custom-text-100 truncate">{currentWorkspace?.display_name}</div>
            <div className="text-xs text-custom-text-300 capitalize">{currentWorkspace?.role}</div>
          </div>
        </div>
      </div>

      {/* Switch Workspaces Section */}
      {otherWorkspaces.length > 0 && (
        <>
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-custom-text-300 uppercase">Switch Workspaces</div>
          </div>

          <div className="px-2 pb-2">
            {otherWorkspaces.map((workspace) => (
              <CustomSelect.Option key={workspace.id} value={workspace} className="!z-[9999]">
                <div className="flex items-center gap-3 w-full">
                  <Avatar
                    shape="square"
                    size="sm"
                    name={workspace.display_name}
                    src={workspace.logo_url || undefined}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{workspace.display_name}</div>
                  </div>
                </div>
              </CustomSelect.Option>
            ))}
          </div>
        </>
      )}
    </CustomSelect>
  );
};
