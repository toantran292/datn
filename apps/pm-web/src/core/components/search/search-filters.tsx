"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Filter, X } from "lucide-react";
import { useSearch } from "@/core/hooks/store/use-search";

const PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const TYPES = ["EPIC", "STORY", "TASK", "BUG"];

export const SearchFilters = observer(() => {
  const searchStore = useSearch();
  const [isExpanded, setIsExpanded] = useState(false);

  const togglePriority = (priority: string) => {
    const current = searchStore.filters.priorities || [];
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];

    searchStore.setFilters({
      ...searchStore.filters,
      priorities: updated.length > 0 ? updated : undefined,
    });
    searchStore.performSearch();
  };

  const toggleType = (type: string) => {
    const current = searchStore.filters.types || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];

    searchStore.setFilters({
      ...searchStore.filters,
      types: updated.length > 0 ? updated : undefined,
    });
    searchStore.performSearch();
  };

  const clearFilters = () => {
    searchStore.setFilters({});
    searchStore.performSearch();
  };

  const hasFilters = searchStore.hasActiveFilters;

  return (
    <div className="border-b border-gray-200/50 dark:border-gray-700/50">
      {/* Filter toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Filters
          </span>
          {hasFilters && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
              {Object.values(searchStore.filters).filter((v) => Array.isArray(v) ? v.length > 0 : v).length}
            </span>
          )}
        </div>
        <ChevronDown
          className={`size-4 text-gray-400 dark:text-gray-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Filter content */}
      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 space-y-3">
          {/* Priority filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((priority) => {
                const isSelected = searchStore.filters.priorities?.includes(priority);
                return (
                  <button
                    key={priority}
                    onClick={() => togglePriority(priority)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    {priority}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((type) => {
                const isSelected = searchStore.filters.types?.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <div className="pt-2">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <X className="size-3" />
                <span>Clear all filters</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
