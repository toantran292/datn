import { FC } from "react";
import Link from "next/link";

import { cn } from "@uts/fe-utils";

export type TProjectTabKey = "backlog" | "board" | "calendar";

interface ProjectTabsProps {
  workspaceSlug?: string;
  projectId?: string;
  active: TProjectTabKey;
}

const TABS: Array<{ key: TProjectTabKey; label: string; path: string }> = [
  { key: "backlog", label: "Backlog", path: "backlog" },
  { key: "board", label: "Board", path: "board" },
  { key: "calendar", label: "Calendar", path: "calendar" },
];

export const ProjectTabs: FC<ProjectTabsProps> = ({ workspaceSlug, projectId, active }) => {
  if (!workspaceSlug || !projectId) return null;

  return (
    <nav aria-label="Project navigation" className="flex items-center gap-4">
      {TABS.map((tab) => {
        const href = `/${workspaceSlug}/project/${projectId}/${tab.path}`;
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "border-b-2 pb-2 text-sm transition-colors",
              isActive
                ? "border-custom-primary-100 font-medium text-custom-primary-100"
                : "border-transparent text-custom-text-300 hover:text-custom-text-100"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
