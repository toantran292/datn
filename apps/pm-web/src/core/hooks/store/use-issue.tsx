import { useContext } from "react";

import { StoreContext } from "@/core/lib/store-context";
import type { IIssueStore } from "@/core/store/issue/issue.store";

export const useIssue = (): IIssueStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssue must be used within StoreProvider");
  return context.projectRoot.issue;
};
