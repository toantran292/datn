import { cn } from "@unified-teamspace/fe-utils";
import { observer } from "mobx-react";
import { FC, useRef, useState } from "react";
import { Disclosure, Transition } from "@headlessui/react";
import { Plus } from "lucide-react";
import { Tooltip } from "@unified-teamspace/ui";
import { CreateProjectModal } from "../../project/create-project-modal";

export const SidebarProjectsList: FC = observer(() => {
  // states
  const [isAllProjectsListOpen, setIsAllProjectsListOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false); // scroll animation state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleListDisclosure = (isOpen: boolean) => {
    setIsAllProjectsListOpen(isOpen);
    localStorage.setItem("isAllProjectsListOpen", isOpen.toString());
  };

  return (
    <>
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        setToFavorite={false}
        workspaceSlug="dattuan"
      />

      <div
        ref={containerRef}
        className={cn({
          "border-t border-custom-sidebar-border-300": isScrolled,
        })}
      >
        <Disclosure as="div" className="flex flex-col" defaultOpen={isAllProjectsListOpen}>
          <div className="group w-full flex items-center justify-between px-2 py-1.5 rounded text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90">
            <Disclosure.Button
              as="button"
              type="button"
              className="w-full flex items-center gap-1 whitespace-nowrap text-left text-sm font-semibold text-custom-sidebar-text-400"
              onClick={() => toggleListDisclosure(!isAllProjectsListOpen)}
              // i18n
              aria-label={isAllProjectsListOpen ? "close project menu" : "open project menu"}
            >
              {/* i18n */}
              <span className="text-sm font-semibold">Project</span>
            </Disclosure.Button>

            <div className="flex items-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
              <Tooltip tooltipHeading="create project" tooltipContent="">
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-custom-sidebar-background-80 flex-shrink-0"
                  onClick={() => {
                    setIsProjectModalOpen(true);
                  }}
                  aria-label="create-new-project"
                >
                  <Plus className="size-3" />
                </button>
              </Tooltip>
            </div>
          </div>
        </Disclosure>
      </div>
    </>
  );
});
