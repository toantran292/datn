"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";

import { Loader, Tooltip, TOAST_TYPE, setToast } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";

import { useProjectsContext } from "@/core/contexts/projects-context";

import { CreateProjectModal } from "../../project/create-project-modal";
import { SidebarProjectsListItem } from "./projects-list-item";

const STORAGE_KEY = "datn-pm-sidebar-projects-open";

export const SidebarProjectsList = () => {
  const [isAllProjectsListOpen, setIsAllProjectsListOpen] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const { workspaceSlug: workspaceSlugParam } = useParams<{ workspaceSlug?: string }>();
  const pathname = usePathname();

  const workspaceSlug = workspaceSlugParam?.toString();

  const { projects, isLoading, mutate } = useProjectsContext();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue !== null) {
      setIsAllProjectsListOpen(storedValue === "true");
    }
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleScroll = () => {
      setIsScrolled(element.scrollTop > 0);
    };

    element.addEventListener("scroll", handleScroll);
    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
        canScroll: ({ source }) => source?.data?.dragInstanceId === "PROJECTS",
        getAllowedAxis: () => "vertical",
      })
    );
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (!pathname.includes("/projects/")) return;
    setIsAllProjectsListOpen(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
  }, [pathname]);

  const toggleListDisclosure = (isOpen: boolean) => {
    setIsAllProjectsListOpen(isOpen);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, isOpen.toString());
    }
  };

  const handleCopyText = async (projectId: string) => {
    if (!workspaceSlug) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const projectUrl = `${origin}/${workspaceSlug}/project/${projectId}/backlog`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(projectUrl);
      } else {
        throw new Error("Clipboard API not supported");
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã sao chép liên kết",
        message: "Đường dẫn dự án đã được sao chép",
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: "Không thể sao chép đường dẫn dự án",
      });
    }
  };

  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);

  const shouldShowEmptyState = useMemo(() => !isLoading && projectIds.length === 0, [isLoading, projectIds.length]);

  return (
    <>
      {workspaceSlug && (
        <CreateProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          setToFavorite={false}
          workspaceSlug={workspaceSlug}
          onSuccess={() => mutate()}
        />
      )}
      <div
        ref={containerRef}
        className={cn({
          "border-t border-custom-sidebar-border-300": isScrolled,
        })}
      >
        {/* <Disclosure as="div" className="flex flex-col" defaultOpen={isAllProjectsListOpen}>
          <div className="group w-full flex items-center justify-between px-2 py-1.5 rounded text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90">
            <Disclosure.Button
              as="button"
              type="button"
              className="w-full flex items-center gap-1 whitespace-nowrap text-left text-sm font-semibold text-custom-sidebar-text-400"
              onClick={() => toggleListDisclosure(!isAllProjectsListOpen)}
              aria-label={isAllProjectsListOpen ? "Đóng danh sách dự án" : "Mở danh sách dự án"}
            >
              <span className="text-sm font-semibold">Dự án</span>
            </Disclosure.Button>
            <div className="flex items-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
              {workspaceSlug && (
                <Tooltip tooltipHeading="Tạo dự án" tooltipContent="">
                  <button
                    type="button"
                    className="p-0.5 rounded hover:bg-custom-sidebar-background-80 flex-shrink-0"
                    onClick={() => setIsProjectModalOpen(true)}
                    aria-label="tạo dự án mới"
                  >
                    <Plus className="size-3" />
                  </button>
                </Tooltip>
              )}
              <Disclosure.Button
                as="button"
                type="button"
                className="p-0.5 rounded hover:bg-custom-sidebar-background-80 flex-shrink-0"
                onClick={() => toggleListDisclosure(!isAllProjectsListOpen)}
                aria-label={isAllProjectsListOpen ? "Đóng danh sách dự án" : "Mở danh sách dự án"}
              >
                <ChevronRight
                  className={cn("flex-shrink-0 size-3 transition-all", {
                    "rotate-90": isAllProjectsListOpen,
                  })}
                />
              </Disclosure.Button>
            </div>
          </div>
          <Transition
            show={isAllProjectsListOpen}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            {isLoading && (
              <Loader className="w-full space-y-1.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Loader.Item key={index} height="28px" />
                ))}
              </Loader>
            )}
            {isAllProjectsListOpen && projectIds.length > 0 && (
              <Disclosure.Panel as="div" className="flex flex-col gap-0.5" static>
                {projectIds.map((projectId, index) => (
                  <SidebarProjectsListItem
                    key={projectId}
                    projectId={projectId}
                    handleCopyText={() => handleCopyText(projectId)}
                    projectListType="JOINED"
                    disableDrag={false}
                    disableDrop
                    isLastChild={index === projectIds.length - 1}
                  />
                ))}
              </Disclosure.Panel>
            )}
            {isAllProjectsListOpen && shouldShowEmptyState && (
              <div className="px-2 py-1.5 text-xs text-custom-sidebar-text-400">
                Chưa có dự án nào. Hãy tạo dự án đầu tiên của bạn.
              </div>
            )}
          </Transition>
        </Disclosure> */}
        {workspaceSlug && shouldShowEmptyState && (
          <button
            type="button"
            className="mt-2 w-full flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 rounded-md"
            onClick={() => setIsProjectModalOpen(true)}
          >
            <Plus className="size-3" />
            Thêm dự án
          </button>
        )}
      </div>
    </>
  );
};
