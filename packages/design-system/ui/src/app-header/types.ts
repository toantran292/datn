import type { IWorkspaceOrg, TPartialProject } from '@uts/types';

export type TAppType = 'pm' | 'chat';

export interface AppHeaderProps {
  currentApp: TAppType;
  workspaceSlug?: string;
  currentWorkspaceId?: string;
  currentProjectId?: string;
  showMenuToggle?: boolean;
  onMenuToggle?: () => void;
  onWorkspaceChange?: (workspace: IWorkspaceOrg) => void;
  onProjectChange?: (project: TPartialProject | null) => void;
  onCreateProject?: () => void;
  apiBaseUrl?: string;
  authWebUrl?: string;
  className?: string;
}

export interface WorkspaceSelectorProps {
  currentWorkspaceId?: string;
  workspaceSlug?: string;
  onWorkspaceChange?: (workspace: IWorkspaceOrg) => void;
  apiBaseUrl?: string;
  authWebUrl?: string;
}

export interface ProjectSelectorProps {
  currentProjectId?: string;
  workspaceId?: string;
  workspaceSlug?: string;
  onProjectChange?: (project: TPartialProject | null) => void;
  onCreateProject?: () => void;
  apiBaseUrl?: string;
}

export interface ProductSwitcherProps {
  currentApp: TAppType;
  workspaceSlug?: string;
}

export interface ThemeToggleProps {
  className?: string;
}

export interface UserMenuProps {
  className?: string;
  apiBaseUrl?: string;
  authWebUrl?: string;
}
