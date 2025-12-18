'use client';

import type { ReactNode } from 'react';
import { useResponsive } from '../../hooks/useResponsive';

export interface ChatLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  details?: ReactNode;
}

export function ChatLayout({ sidebar, main, details }: ChatLayoutProps) {
  const { isMobile, sidebarOpen, detailsPanelOpen, closeSidebar, closeDetailsPanel } = useResponsive();

  const handleOverlayClick = () => {
    if (sidebarOpen) {
      closeSidebar();
    }
    if (detailsPanelOpen) {
      closeDetailsPanel();
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Mobile overlay backdrop */}
      {isMobile && (sidebarOpen || detailsPanelOpen) && (
        <div
          className="absolute inset-0 bg-black/50 z-30 md:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar - Absolute on mobile, static on desktop */}
      <div
        className={`
          ${isMobile
            ? `absolute top-0 bottom-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
               ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `flex-shrink-0 transition-all duration-300 ease-in-out
               ${sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'}`
          }
        `}
      >
        {sidebar}
      </div>

      {/* Main content - always visible */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {main}
      </div>

      {/* Details panel - Absolute on mobile/tablet, static on desktop */}
      {details && (
        <div
          className={`
            ${isMobile
              ? `absolute top-0 bottom-0 right-0 z-40 transform transition-transform duration-300 ease-in-out
                 ${detailsPanelOpen ? 'translate-x-0' : 'translate-x-full'}`
              : `flex-shrink-0 transition-all duration-300 ease-in-out
                 ${detailsPanelOpen ? 'w-[360px] lg:w-[360px]' : 'w-0 overflow-hidden'}`
            }
          `}
        >
          {details}
        </div>
      )}
    </div>
  );
}
