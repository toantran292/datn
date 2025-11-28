"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import { cn } from "@uts/fe-utils";
import { useSidebar } from "@/core/contexts/sidebar-context";
import { AppSidebar } from "./sidebar";

export const ProjectAppSidebar: FC = observer(() => {
  const { isSidebarCollapsed } = useSidebar();

  return (
    <div
      className={cn(
        "h-full z-20 bg-custom-background-100 border-r border-custom-sidebar-border-200 transition-all duration-300",
        isSidebarCollapsed && "!w-0 !min-w-0 !max-w-0 border-r-0 overflow-hidden"
      )}
      style={{
        width: isSidebarCollapsed ? "0px" : "200px",
        minWidth: isSidebarCollapsed ? "0px" : "200px",
        maxWidth: isSidebarCollapsed ? "0px" : "200px",
      }}
      role="complementary"
      aria-label="Main sidebar"
    >
      <AppSidebar />
    </div>
  );
});
