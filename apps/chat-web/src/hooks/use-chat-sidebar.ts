'use client';

import { useChatContext } from '../contexts/ChatContext';

/**
 * Hook to manage sidebar state and operations
 */
export function useChatSidebar() {
  const {
    sidebarOpen,
    sidebarTab,
    handleToggleSidebar,
    handleCloseSidebar,
    setSidebarTab,
  } = useChatContext();

  return {
    isOpen: sidebarOpen,
    activeTab: sidebarTab,
    toggle: handleToggleSidebar,
    close: handleCloseSidebar,
    setTab: setSidebarTab,
  };
}
