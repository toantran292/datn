"use client";

import type { ElementType, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { Disclosure, Transition } from "@headlessui/react";
import { Link as LinkIcon, MoreHorizontal, Settings, ChevronRight, FileText } from "lucide-react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createRoot } from "react-dom/client";

import { cn } from "@unified-teamspace/fe-utils";
import { useLocalStorage, useOutsideClickDetector, usePlatformOS } from "@unified-teamspace/hooks";
import {
  ControlLink,
  CustomMenu,
  DragHandle,
  DropIndicator,
  Logo,
  Tooltip,
  ContrastIcon,
  DiceIcon,
  Intake,
  LayersIcon,
} from "@unified-teamspace/ui";

import { useProject } from "@/core/hooks/store/use-project";

import { SidebarNavItem } from "./sidebar-navigation";

type Props = {
  projectId: string;
  handleCopyText: () => void;
  handleOnProjectDrop?: (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => void;
  projectListType: "JOINED" | "FAVORITES";
  disableDrag?: boolean;
  disableDrop?: boolean;
  isLastChild: boolean;
  renderInExtendedSidebar?: boolean;
};

type TDragInstruction = "DRAG_OVER" | "DRAG_BELOW" | undefined;

type TProjectNavItem = {
  key: string;
  label: string;
  href: string;
  icon: ElementType;
  shouldRender: boolean;
};

export const SidebarProjectsListItem: React.FC<Props> = observer((props) => {
  const {
    projectId,
    handleCopyText,
    disableDrag,
    disableDrop,
    isLastChild,
    handleOnProjectDrop,
    projectListType,
    renderInExtendedSidebar = false,
  } = props;

  const { getPartialProjectById } = useProject();
  const { isMobile } = usePlatformOS();
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceSlug: workspaceSlugParam, projectId: routeProjectId } = useParams<{
    workspaceSlug?: string;
    projectId?: string;
  }>();

  const actionSectionRef = useRef<HTMLSpanElement | null>(null);
  const projectRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<TDragInstruction>(undefined);

  const project = getPartialProjectById(projectId);
  const storageKey = useMemo(() => `pm-sidebar-project-${projectId}`, [projectId]);
  const { storedValue: storedDisclosureState, setValue: setDisclosureState } = useLocalStorage<boolean>(
    storageKey,
    false
  );

  const normalizedWorkspaceSlug = useMemo(() => {
    if (workspaceSlugParam) return workspaceSlugParam;
    if (!project) return undefined;
    if (typeof project.workspace === "string") return project.workspace;
    return project.workspace?.slug;
  }, [workspaceSlugParam, project]);

  useEffect(() => {
    if (routeProjectId === projectId && storedDisclosureState !== true) {
      setDisclosureState(true);
    }
  }, [projectId, routeProjectId, storedDisclosureState, setDisclosureState]);

  const canProjectDrag = !disableDrag && (project?.sort_order ?? null) !== null;

  useEffect(() => {
    const element = projectRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => canProjectDrag,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id: projectId, dragInstanceId: "PROJECTS" }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          if (!project) return;
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({ x: "0px", y: "0px" }),
            render: ({ container }) => {
              const root = createRoot(container);
              root.render(
                <div className="rounded flex items-center bg-custom-background-100 text-sm p-1 pr-2">
                  <div className="size-4 grid place-items-center flex-shrink-0">
                    <Logo logo={project.logo_props} size={16} type="lucide" />
                  </div>
                  <p className="truncate text-custom-sidebar-text-200">{project.name}</p>
                </div>
              );
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          !disableDrop && source?.data?.id !== projectId && source?.data?.dragInstanceId === "PROJECTS",
        getData: ({ input, element }) =>
          attachInstruction({ id: projectId }, {
            input,
            element,
            currentLevel: 0,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
          }),
        onDrag: ({ self }) => {
          const extractedInstruction = extractInstruction(self?.data)?.type;
          setInstruction(
            extractedInstruction
              ? extractedInstruction === "reorder-below" && isLastChild
                ? "DRAG_BELOW"
                : "DRAG_OVER"
              : undefined
          );
        },
        onDragLeave: () => {
          setInstruction(undefined);
        },
        onDrop: ({ self, source }) => {
          setInstruction(undefined);
          const extractedInstruction = extractInstruction(self?.data)?.type;
          const currentInstruction = extractedInstruction
            ? extractedInstruction === "reorder-below" && isLastChild
              ? "DRAG_BELOW"
              : "DRAG_OVER"
            : undefined;
          if (!currentInstruction) return;

          const sourceId = source?.data?.id as string | undefined;
          const destinationId = self?.data?.id as string | undefined;

          handleOnProjectDrop?.(sourceId, destinationId, currentInstruction === "DRAG_BELOW");
        },
      })
    );
  }, [projectId, canProjectDrag, disableDrop, isLastChild, projectListType, handleOnProjectDrop, project]);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));
  useOutsideClickDetector(projectRef, () => setIsMenuActive(false));

  const projectIssuesPath = useMemo(() => {
    if (!normalizedWorkspaceSlug || !project) return "#";
    return `/${normalizedWorkspaceSlug}/projects/${project.id}/issues`;
  }, [normalizedWorkspaceSlug, project]);

  const projectSettingsPath = useMemo(() => {
    if (!normalizedWorkspaceSlug || !project) return "#";
    return `/${normalizedWorkspaceSlug}/projects/${project.id}/settings`;
  }, [normalizedWorkspaceSlug, project]);

  const navigationItems = useMemo<TProjectNavItem[]>(() => {
    if (!project || !normalizedWorkspaceSlug) return [];

    const basePath = `/${normalizedWorkspaceSlug}/projects/${project.id}`;

    return [
      {
        key: "issues",
        label: "Work items",
        href: `${basePath}/issues`,
        icon: LayersIcon,
        shouldRender: true,
      },
      {
        key: "cycles",
        label: "Cycles",
        href: `${basePath}/cycles`,
        icon: ContrastIcon,
        shouldRender: !!project.cycle_view,
      },
      {
        key: "modules",
        label: "Modules",
        href: `${basePath}/modules`,
        icon: DiceIcon,
        shouldRender: !!project.module_view,
      },
      {
        key: "views",
        label: "Views",
        href: `${basePath}/views`,
        icon: LayersIcon,
        shouldRender: !!project.issue_views_view,
      },
      {
        key: "pages",
        label: "Pages",
        href: `${basePath}/pages`,
        icon: FileText,
        shouldRender: !!project.page_view,
      },
      {
        key: "intake",
        label: "Intake",
        href: `${basePath}/intake`,
        icon: Intake,
        shouldRender: !!project.inbox_view,
      },
    ].filter((item) => item.shouldRender);
  }, [normalizedWorkspaceSlug, project]);

  if (!project) return null;

  const isDragDisabled = !canProjectDrag;
  const disclosureKey = `${project.id}_${routeProjectId ?? "unknown"}`;

  const handleNavigateToIssues = (_event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (projectIssuesPath === "#") return;
    router.push(projectIssuesPath);
  };

  return (
    <Disclosure key={disclosureKey} defaultOpen={storedDisclosureState ?? false} as="div">
      {({ open }) => (
        <div
          id={`sidebar-${projectId}-${projectListType}`}
          className={cn("relative", {
            "bg-custom-sidebar-background-80/60": isDragging,
          })}
          ref={projectRef}
        >
          <DropIndicator classNames="absolute top-0" isVisible={instruction === "DRAG_OVER"} />
          <div
            className={cn(
              "group/project-item relative w-full px-2 py-1.5 flex items-center rounded-md text-custom-sidebar-text-100 hover:bg-custom-sidebar-background-90",
              {
                "bg-custom-sidebar-background-90": isMenuActive,
              }
            )}
          >
            {!disableDrag && (
              <Tooltip
                isMobile={isMobile}
                tooltipContent={isDragDisabled ? "Join the project to rearrange" : "Drag to rearrange"}
                position="top-right"
                disabled={isDragging}
              >
                <button
                  type="button"
                  className={cn(
                    "hidden group-hover/project-item:flex items-center justify-center absolute top-1/2 -left-3 -translate-y-1/2 rounded text-custom-sidebar-text-400",
                    {
                      "cursor-not-allowed opacity-60": isDragDisabled,
                      "cursor-grabbing": isDragging,
                      flex: isMenuActive || renderInExtendedSidebar,
                    }
                  )}
                  ref={dragHandleRef}
                  disabled={isDragDisabled}
                >
                  <DragHandle className="bg-transparent" disabled={isDragDisabled} />
                </button>
              </Tooltip>
            )}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <ControlLink
                href={projectIssuesPath}
                className="flex-grow flex items-center gap-1.5 truncate"
                disabled={projectIssuesPath === "#"}
                onClick={handleNavigateToIssues}
                draggable={false}
              >
                <div className="size-4 grid place-items-center flex-shrink-0">
                  <Logo logo={project.logo_props} size={16} type="lucide" />
                </div>
                <p className="truncate text-sm font-medium text-custom-sidebar-text-200">{project.name}</p>
              </ControlLink>
              <CustomMenu
                customButton={
                  <span
                    ref={actionSectionRef}
                    className="grid place-items-center p-0.5 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80 rounded"
                    onClick={() => setIsMenuActive((prev) => !prev)}
                    data-prevent-outside-click
                  >
                    <MoreHorizontal className="size-4" />
                  </span>
                }
                className={cn(
                  "opacity-0 pointer-events-none flex-shrink-0 group-hover/project-item:opacity-100 group-hover/project-item:pointer-events-auto",
                  {
                    "opacity-100 pointer-events-auto": isMenuActive,
                  }
                )}
                customButtonClassName="grid place-items-center"
                placement="bottom-start"
                useCaptureForOutsideClick
                closeOnSelect
                onMenuClose={() => setIsMenuActive(false)}
              >
                <CustomMenu.MenuItem onClick={handleCopyText}>
                  <span className="flex items-center justify-start gap-2">
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>Copy link</span>
                  </span>
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem
                  onClick={() => {
                    if (projectSettingsPath === "#") return;
                    router.push(projectSettingsPath);
                  }}
                  disabled={projectSettingsPath === "#"}
                >
                  <div className="flex items-center justify-start gap-2">
                    <Settings className="h-3.5 w-3.5" />
                    <span>Project settings</span>
                  </div>
                </CustomMenu.MenuItem>
              </CustomMenu>
              <Disclosure.Button
                as="button"
                type="button"
                className="p-0.5 rounded hover:bg-custom-sidebar-background-80"
                onClick={() => setDisclosureState(!open)}
                aria-label={open ? "Collapse project navigation" : "Expand project navigation"}
              >
                <ChevronRight
                  className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform", {
                    "rotate-90": open,
                  })}
                />
              </Disclosure.Button>
            </div>
          </div>
          <Transition
            show={open && navigationItems.length > 0}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            {open && navigationItems.length > 0 && (
              <Disclosure.Panel as="div" className="flex flex-col gap-0.5 mt-1">
                {navigationItems.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = pathname ? pathname.startsWith(item.href) : false;
                  return (
                    <Link key={item.key} href={item.href}>
                      <SidebarNavItem className="pl-[18px]" isActive={isActive}>
                        <div className="flex items-center gap-1.5 py-[1px]">
                          <ItemIcon className="size-4 flex-shrink-0" />
                          <span className="text-xs font-medium">{item.label}</span>
                        </div>
                      </SidebarNavItem>
                    </Link>
                  );
                })}
              </Disclosure.Panel>
            )}
          </Transition>
          {isLastChild && <DropIndicator isVisible={instruction === "DRAG_BELOW"} />}
        </div>
      )}
    </Disclosure>
  );
});
