"use client";

import { MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createRoot } from "react-dom/client";
import { Link as LinkIcon, MoreHorizontal, Settings } from "lucide-react";

import { ControlLink, CustomMenu, DragHandle, DropIndicator, Logo, Tooltip } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";
import { useOutsideClickDetector, usePlatformOS } from "@uts/hooks";

import { useProjectsContext } from "@/core/contexts/projects-context";

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

  const { getProjectById } = useProjectsContext();
  const { isMobile } = usePlatformOS();
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceSlug: workspaceSlugParam } = useParams<{
    workspaceSlug?: string;
  }>();

  const actionSectionRef = useRef<HTMLSpanElement | null>(null);
  const projectRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<TDragInstruction>(undefined);
  const [isExpanded, setIsExpanded] = useState(false);

  const project = getProjectById(projectId);

  const normalizedWorkspaceSlug = useMemo(() => {
    if (workspaceSlugParam) return workspaceSlugParam;
    if (!project) return undefined;
    if (typeof project.workspace === "string") return project.workspace;
    return project.workspace?.slug;
  }, [workspaceSlugParam, project]);

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

  const projectBacklogPath = useMemo(() => {
    if (!normalizedWorkspaceSlug || !project) return "#";
    return `/${normalizedWorkspaceSlug}/project/${project.id}/backlog`;
  }, [normalizedWorkspaceSlug, project]);

  const projectSettingsPath = useMemo(() => {
    if (!normalizedWorkspaceSlug || !project) return "#";
    return `/${normalizedWorkspaceSlug}/projects/${project.id}/settings`;
  }, [normalizedWorkspaceSlug, project]);

  if (!project) return null;

  const isDragDisabled = !canProjectDrag;
  const isActive = projectBacklogPath !== "#" && pathname?.startsWith(projectBacklogPath);

  const handleNavigateToBacklog = (_event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (projectBacklogPath === "#") return;
    router.push(projectBacklogPath);
  };

  return (
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
            "bg-custom-sidebar-background-90/80": isActive,
          }
        )}
        data-active={isActive}
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
            href={projectBacklogPath}
            className={cn(
              "flex-grow flex items-center gap-1.5 truncate",
              {
                "pointer-events-none": projectBacklogPath === "#",
              }
            )}
            disabled={projectBacklogPath === "#"}
            onClick={handleNavigateToBacklog}
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
                <span>Sao chép liên kết</span>
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
                <span>Cài đặt dự án</span>
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
      {isLastChild && <DropIndicator isVisible={instruction === "DRAG_BELOW"} />}
    </div>
  );
});
