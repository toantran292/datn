import { makeObservable, observable, action, computed, runInAction } from "mobx";
import type { CoreRootStore } from "../root.store";

export interface SearchResult {
  id: string;
  name: string;
  description?: string;
  type: string;
  priority: string;
  projectId: string;
  status: {
    id: string;
    name: string;
    color: string;
  };
  similarity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchFilters {
  priorities?: string[];
  types?: string[];
  statusIds?: string[];
  sprintIds?: string[];
  noSprint?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  useAI: boolean;
}

export class SearchStore {
  // Search state
  query: string = "";
  useAI: boolean = false;

  // Results state
  results: SearchResult[] = [];
  total: number = 0;
  page: number = 1;
  limit: number = 20;
  totalPages: number = 0;

  // Filter state
  filters: SearchFilters = {};

  // UI state
  isModalOpen: boolean = false;
  isLoading: boolean = false;
  selectedIndex: number = 0;

  // History
  searchHistory: string[] = [];

  constructor(private _rootStore: CoreRootStore) {
    makeObservable(this, {
      query: observable,
      useAI: observable,
      results: observable,
      total: observable,
      page: observable,
      limit: observable,
      totalPages: observable,
      filters: observable,
      isModalOpen: observable,
      isLoading: observable,
      selectedIndex: observable,
      searchHistory: observable,

      setQuery: action,
      toggleAI: action,
      setFilters: action,
      setModalOpen: action,
      setSelectedIndex: action,
      performSearch: action,
      clearSearch: action,
      addToHistory: action,
      clearHistory: action,

      hasActiveFilters: computed,
      hasResults: computed,
      selectedResult: computed,
    });

    this.loadHistory();
  }

  /**
   * Set search query
   */
  setQuery(query: string) {
    this.query = query;
  }

  /**
   * Toggle AI search mode
   */
  toggleAI() {
    this.useAI = !this.useAI;
  }

  /**
   * Set filters
   */
  setFilters(filters: SearchFilters) {
    this.filters = filters;
  }

  /**
   * Open/close modal
   */
  setModalOpen(open: boolean) {
    this.isModalOpen = open;
    if (open) {
      this.selectedIndex = 0;
    } else {
      this.clearSearch();
    }
  }

  /**
   * Set selected result index
   */
  setSelectedIndex(index: number) {
    if (index >= 0 && index < this.results.length) {
      this.selectedIndex = index;
    }
  }

  /**
   * Move selection up
   */
  selectPrevious() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
    }
  }

  /**
   * Move selection down
   */
  selectNext() {
    if (this.selectedIndex < this.results.length - 1) {
      this.selectedIndex++;
    }
  }

  /**
   * Perform search
   */
  async performSearch() {
    if (!this.query.trim() && Object.keys(this.filters).length === 0) {
      this.results = [];
      this.total = 0;
      return;
    }

    this.isLoading = true;

    try {
      const queryParams = new URLSearchParams();

      if (this.query.trim()) {
        queryParams.set("query", this.query.trim());
        queryParams.set("useAI", String(this.useAI));
      }

      if (this.filters.priorities && this.filters.priorities.length > 0) {
        queryParams.set("priorities", this.filters.priorities.join(","));
      }
      if (this.filters.types && this.filters.types.length > 0) {
        queryParams.set("types", this.filters.types.join(","));
      }
      if (this.filters.statusIds && this.filters.statusIds.length > 0) {
        queryParams.set("statusIds", this.filters.statusIds.join(","));
      }
      if (this.filters.sprintIds && this.filters.sprintIds.length > 0) {
        queryParams.set("sprintIds", this.filters.sprintIds.join(","));
      }
      if (this.filters.noSprint) {
        queryParams.set("noSprint", "true");
      }

      queryParams.set("page", String(this.page));
      queryParams.set("limit", String(this.limit));

      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/pm";
      const response = await fetch(`${baseURL}/api/issues/search?${queryParams.toString()}`, {
        method: "GET",
        credentials: "include", // Send cookies for authentication
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: SearchResponse = await response.json();

      runInAction(() => {
        this.results = data.results;
        this.total = data.total;
        this.totalPages = data.totalPages;
        this.selectedIndex = 0;

        // Add to history if it's a query search
        if (this.query.trim()) {
          this.addToHistory(this.query.trim());
        }
      });
    } catch (error) {
      console.error("Search error:", error);
      runInAction(() => {
        this.results = [];
        this.total = 0;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Clear search
   */
  clearSearch() {
    this.query = "";
    this.results = [];
    this.total = 0;
    this.page = 1;
    this.totalPages = 0;
    this.selectedIndex = 0;
    this.filters = {};
  }

  /**
   * Add to search history
   */
  private addToHistory(query: string) {
    if (!this.searchHistory.includes(query)) {
      this.searchHistory = [query, ...this.searchHistory.slice(0, 9)]; // Keep last 10
      this.saveHistory();
    }
  }

  /**
   * Clear search history
   */
  clearHistory() {
    this.searchHistory = [];
    this.saveHistory();
  }

  /**
   * Load search history from localStorage
   */
  private loadHistory() {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("pm_search_history");
      if (stored) {
        this.searchHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }

  /**
   * Save search history to localStorage
   */
  private saveHistory() {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("pm_search_history", JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  }

  /**
   * Check if any filters are active
   */
  get hasActiveFilters(): boolean {
    return Object.values(this.filters).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null;
    });
  }

  /**
   * Check if there are results
   */
  get hasResults(): boolean {
    return this.results.length > 0;
  }

  /**
   * Get selected result
   */
  get selectedResult(): SearchResult | null {
    return this.results[this.selectedIndex] || null;
  }
}
