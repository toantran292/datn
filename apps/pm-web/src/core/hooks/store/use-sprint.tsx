import { useContext } from "react";

import { StoreContext } from "@/core/lib/store-context";
import type { ISprintStore } from "@/core/store/sprint/sprint.store";

export const useSprint = (): ISprintStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useSprint must be used within StoreProvider");
  return context.projectRoot.sprint;
};
