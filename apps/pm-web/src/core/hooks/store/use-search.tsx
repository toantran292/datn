import { useContext } from "react";
import { StoreContext } from "@/core/lib/store-context";
import type { SearchStore } from "@/core/store/search/search.store";

export const useSearch = (): SearchStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useSearch must be used within StoreProvider");
  return context.projectRoot.search;
};
