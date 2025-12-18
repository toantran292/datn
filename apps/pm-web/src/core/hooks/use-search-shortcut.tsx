"use client";

import { useEffect } from "react";
import { useSearch } from "@/core/hooks/store/use-search";

/**
 * Global keyboard shortcut hook for opening search modal
 * Listens for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
 */
export const useSearchShortcut = () => {
  const searchStore = useSearch();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchStore.setModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchStore]);
};
