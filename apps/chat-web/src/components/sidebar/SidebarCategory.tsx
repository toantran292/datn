import { useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';

export interface SidebarCategoryProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onAddClick?: () => void;
  onMoreClick?: () => void;
  showMoreMenu?: boolean;
  moreMenuContent?: React.ReactNode;
  onCloseMoreMenu?: () => void;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function SidebarCategory({
  title,
  icon,
  children,
  defaultExpanded = true,
  onAddClick,
  onMoreClick,
  showMoreMenu,
  moreMenuContent,
  emptyMessage,
  isEmpty,
}: SidebarCategoryProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-2">
      {/* Category Header */}
      <div
        className="group flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-custom-background-80 rounded-md transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-custom-text-300 transition-transform duration-200">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          {icon && <span className="text-custom-text-300">{icon}</span>}
          <span className="text-xs font-semibold text-custom-text-300 uppercase tracking-wide truncate">
            {title}
          </span>
        </div>

        {/* Action buttons - visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity relative">
          {onMoreClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoreClick();
              }}
              className="p-1 rounded hover:bg-custom-background-90 text-custom-text-300 hover:text-custom-text-100"
              title="Thêm tùy chọn"
            >
              <MoreHorizontal size={14} />
            </button>
          )}
          {onAddClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddClick();
              }}
              className="p-1 rounded hover:bg-custom-background-90 text-custom-text-300 hover:text-custom-text-100"
              title="Thêm"
            >
              <Plus size={14} />
            </button>
          )}

          {/* More menu dropdown */}
          {showMoreMenu && moreMenuContent && (
            <div
              className="absolute right-0 top-6 z-20 bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-lg py-1 min-w-[180px]"
              onClick={(e) => e.stopPropagation()}
            >
              {moreMenuContent}
            </div>
          )}
        </div>
      </div>

      {/* Category Content */}
      {expanded && (
        <div className="mt-0.5">
          {isEmpty ? (
            <p className="text-custom-text-400 text-xs px-3 py-2 italic">
              {emptyMessage || 'Không có mục nào'}
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

// Menu item for category dropdown
export interface MenuItemProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function MenuItem({ onClick, children }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm text-custom-text-200 hover:bg-custom-background-80 transition-colors"
    >
      {children}
    </button>
  );
}
