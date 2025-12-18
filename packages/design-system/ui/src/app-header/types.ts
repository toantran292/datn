import type { IWorkspaceOrg, TPartialProject } from '@uts/types';

export type TAppType = 'pm' | 'chat' | 'tenant-web';

// AppHeader hiện phụ thuộc hoàn toàn vào AppHeaderProvider để lấy data & hành vi.
// App không còn truyền handler vào AppHeader nữa; toàn bộ logic chuyển workspace/project thuộc về lib.
export interface AppHeaderProps {
  className?: string;
  searchTrigger?: React.ReactNode;
}

export interface WorkspaceSelectorProps {
  className?: string;
}

export interface ProjectSelectorProps {
  // Chỉ cần callback để mở modal tạo project, phần còn lại dùng context
  onCreateProject?: () => void;
  className?: string;
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
