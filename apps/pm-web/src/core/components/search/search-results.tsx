"use client";

import React from "react";
import { observer } from "mobx-react";
import { useSearch } from "@/core/hooks/store/use-search";
import { FileText, Sparkles, Clock, Search } from "lucide-react";
import type { SearchResult } from "@/core/store/search/search.store";

interface SearchResultsProps {
  onSelectResult: (projectId: string, issueId: string) => void;
}

const PRIORITY_COLORS = {
  CRITICAL: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
  HIGH: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
  MEDIUM: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30",
  LOW: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
};

const TYPE_COLORS = {
  EPIC: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
  STORY: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  TASK: "text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30",
  BUG: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
};

const ResultItem = observer(({ result, isSelected, onClick }: {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const priorityColor = PRIORITY_COLORS[result.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.MEDIUM;
  const typeColor = TYPE_COLORS[result.type as keyof typeof TYPE_COLORS] || TYPE_COLORS.TASK;

  return (
    <div
      onClick={onClick}
      className={`group px-4 py-3 cursor-pointer transition-all duration-150 border-l-4 ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
          : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5">
          <FileText className="size-4 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with similarity score */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {result.name}
            </h4>
            {result.similarity !== undefined && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded text-xs font-medium text-purple-700 dark:text-purple-300">
                <Sparkles className="size-3" />
                <span>{Math.round(result.similarity * 100)}%</span>
              </div>
            )}
          </div>

          {/* Description */}
          {result.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {result.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type */}
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeColor}`}>
              {result.type}
            </span>

            {/* Priority */}
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${priorityColor}`}>
              {result.priority}
            </span>

            {/* Status */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: result.status.color }}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {result.status.name}
              </span>
            </div>

            {/* Updated time */}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="size-3" />
              <span>{formatRelativeTime(result.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const SearchResults = observer(({ onSelectResult }: SearchResultsProps) => {
  const searchStore = useSearch();

  // Empty state
  if (!searchStore.query && !searchStore.hasActiveFilters) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Search className="size-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            Search for issues
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Find issues by name, description, or use AI for semantic search
          </p>

          {/* Search History */}
          {searchStore.searchHistory.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Recent searches</h4>
                <button
                  onClick={() => searchStore.clearHistory()}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchStore.searchHistory.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      searchStore.setQuery(query);
                      searchStore.performSearch();
                    }}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (searchStore.isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="size-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Searching{searchStore.useAI ? " with AI" : ""}...</span>
          </div>
        </div>
      </div>
    );
  }

  // No results
  if (!searchStore.hasResults) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Search className="size-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            No results found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {searchStore.useAI ? (
              <>Try different keywords or disable AI search for exact matches</>
            ) : (
              <>Try different keywords or enable AI search for semantic matching</>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Results list
  return (
    <div className="max-h-[60vh] overflow-y-auto">
      {/* Results header */}
      <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {searchStore.total} {searchStore.total === 1 ? "result" : "results"}
            {searchStore.useAI && " (AI-powered)"}
          </span>
          {searchStore.useAI && (
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
              <Sparkles className="size-3" />
              <span>Sorted by relevance</span>
            </div>
          )}
        </div>
      </div>

      {/* Results items */}
      <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {searchStore.results.map((result, index) => (
          <ResultItem
            key={result.id}
            result={result}
            isSelected={index === searchStore.selectedIndex}
            onClick={() => onSelectResult(result.projectId, result.id)}
          />
        ))}
      </div>
    </div>
  );
});

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}
