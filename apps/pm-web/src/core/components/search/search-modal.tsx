"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { observer } from "mobx-react";
import { X, Search, Sparkles, Loader2, Command } from "lucide-react";
import { useSearch } from "@/core/hooks/store/use-search";
import { useRouter } from "next/navigation";
import { SearchResults } from "./search-results";
import { SearchFilters } from "./search-filters";

export const SearchModal = observer(() => {
  const searchStore = useSearch();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Focus input when modal opens
  useEffect(() => {
    if (searchStore.isModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchStore.isModalOpen]);

  // Debounced search
  const handleQueryChange = useCallback((value: string) => {
    searchStore.setQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchStore.performSearch();
    }, 300);
  }, [searchStore]);

  // Keyboard navigation
  useEffect(() => {
    if (!searchStore.isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        searchStore.setModalOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        searchStore.selectNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        searchStore.selectPrevious();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = searchStore.selectedResult;
        if (selected) {
          handleSelectResult(selected.projectId, selected.id);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "ArrowUp") {
        e.preventDefault();
        searchStore.toggleAI();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchStore, searchStore.isModalOpen, searchStore.selectedResult]);

  const handleSelectResult = (projectId: string, issueId: string) => {
    searchStore.setModalOpen(false);
    router.push(`/project/${projectId}/issue/${issueId}`);
  };

  const handleClearSearch = () => {
    searchStore.clearSearch();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!searchStore.isModalOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200"
        onClick={() => searchStore.setModalOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] pointer-events-none">
        <div
          className="w-full max-w-3xl mx-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glassmorphism Container */}
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* Header */}
            <div className="relative border-b border-gray-200/50 dark:border-gray-700/50">
              {/* AI Mode Glow Effect */}
              {searchStore.useAI && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 animate-pulse" />
              )}

              <div className="relative p-4">
                <div className="flex items-center gap-3">
                  {/* Search Icon */}
                  <div className="relative">
                    <Search className="size-5 text-gray-400 dark:text-gray-500" />
                    {searchStore.isLoading && (
                      <Loader2 className="size-5 text-blue-500 absolute inset-0 animate-spin" />
                    )}
                  </div>

                  {/* Search Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchStore.query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder={
                      searchStore.useAI
                        ? "Search with AI: Try 'login issues' or 'performance problems'..."
                        : "Search issues by name or description..."
                    }
                    className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />

                  {/* AI Toggle */}
                  <button
                    onClick={() => searchStore.toggleAI()}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                      searchStore.useAI
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                    title="Toggle AI Search (Cmd/Ctrl + ↑)"
                  >
                    <Sparkles className="size-4" />
                    <span className="text-xs font-medium">AI</span>
                    {searchStore.useAI && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 blur-md opacity-50 -z-10" />
                    )}
                  </button>

                  {/* Clear Button */}
                  {searchStore.query && (
                    <button
                      onClick={handleClearSearch}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={() => searchStore.setModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <SearchFilters />

            {/* Results */}
            <SearchResults onSelectResult={handleSelectResult} />

            {/* Footer */}
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">↑↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">↵</kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">ESC</kbd>
                    <span>Close</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Command className="size-3" />
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">K</kbd>
                  <span>to open</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
