import { useContext } from "react";

import { StoreContext } from "@/core/lib/store-context";
import type { IIssueStatusStore } from "@/core/store/issue-status/issue-status.store";

export const useIssueStatus = (): IIssueStatusStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssueStatus must be used within StoreProvider");
  return context.projectRoot.issueStatus;
};

