"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import { AppSidebar } from "./sidebar";

import { cn } from "@uts/fe-utils";

export const ProjectAppSidebar: FC = observer(() => {
  return (
    <div
      className={cn("h-full z-20 bg-custom-background-100 border-r border-custom-sidebar-border-200")}
      style={{
        width: `250px`,
        minWidth: `250px`,
        maxWidth: `250px`,
      }}
      role="complementary"
      aria-label="Main sidebar"
    >
      <AppSidebar />
    </div>
  );
});
