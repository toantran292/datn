"use client";

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
import { useSearch } from "@/core/hooks/store/use-search";

/**
 * Search trigger button that opens the global search modal
 * Displays keyboard shortcut hint (⌘K or Ctrl+K)
 */
export const SearchTrigger = observer(() => {
  const searchStore = useSearch();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPod|iPad/.test(navigator.userAgent));
  }, []);

  return (
    <button
      onClick={() => searchStore.setModalOpen(true)}
      className="flex items-center gap-2 px-3 py-1.5 bg-custom-background-80 hover:bg-custom-background-90 border border-custom-border-200 rounded-lg transition-all group"
      aria-label="Open search modal"
    >
      <Search className="size-4 text-custom-text-300 group-hover:text-custom-text-200 transition-colors" />

      <span className="text-xs text-custom-text-400 hidden sm:inline">
        Search...
      </span>

      <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-custom-background-90 border border-custom-border-300 rounded text-[10px] font-mono text-custom-text-400">
        {isMac ? "⌘" : "Ctrl"}K
      </kbd>
    </button>
  );
});

SearchTrigger.displayName = "SearchTrigger";
