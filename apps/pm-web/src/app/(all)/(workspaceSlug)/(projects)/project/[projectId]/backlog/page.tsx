"use client";

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { setToast, TOAST_TYPE } from "@uts/design-system/ui";
import {
  BacklogIssueDropPayload,
  BacklogView,
  IBacklogCreateSprintPayload,
  IBacklogSectionData,
  StartSprintModal,
} from "@/core/components/backlog";
import { CompleteSprintModal } from "@/core/components/sprint/complete-sprint-modal";
import { ProjectTabs } from "@/core/components/project/project-tabs";
import { IdentityService } from "@/core/services/identity/identity.service";
import { ProjectService } from "@/core/services/project/project.service";
import { useIssue } from "@/core/hooks/store/use-issue";
import { useIssueStatus } from "@/core/hooks/store/use-issue-status";
import { useProject } from "@/core/hooks/store/use-project";
import { useSprint } from "@/core/hooks/store/use-sprint";
import { IIssue } from "@/core/types/issue";

const UNIMPLEMENTED_TOAST = () =>
  setToast({
    type: TOAST_TYPE.INFO,
    title: "Tính năng đang phát triển",
    message: "Chúng tôi đang hoàn thiện chức năng này.",
  });

const ProjectBacklogPage = observer(() => {
  const params = useParams<{ workspaceSlug?: string | string[]; projectId?: string | string[] }>();
  const projectIdParam = params?.projectId;
  const workspaceSlugParam = params?.workspaceSlug;
  const projectId = Array.isArray(projectIdParam) ? (projectIdParam[0] ?? "") : (projectIdParam ?? "");
  const workspaceSlug = Array.isArray(workspaceSlugParam) ? (workspaceSlugParam[0] ?? "") : (workspaceSlugParam ?? "");

  const issueStore = useIssue();
  const issueStatusStore = useIssueStatus();
  const sprintStore = useSprint();
  const projectStore = useProject();
  const identityService = useMemo(() => new IdentityService(), []);
  const projectService = useMemo(() => new ProjectService(), []);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [startSprintState, setStartSprintState] = useState<{ sprintId: string; issueCount: number } | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [completeSprintId, setCompleteSprintId] = useState<string | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const {
    fetchIssuesByProject,
    getIssuesForProject,
    getLoaderForProject: getIssueLoader,
    projectFetchStatus: issueFetchStatus,
  } = issueStore;
  const {
    fetchIssueStatusesByProject,
    getIssueStatusesForProject,
    getLoaderForProject: getStatusLoader,
    projectFetchStatus: statusFetchStatus,
  } = issueStatusStore;

  const {
    fetchSprintsByProject,
    getSprintsForProject,
    getLoaderForProject: getSprintLoader,
    projectFetchStatus: sprintFetchStatus,
    createSprint,
  } = sprintStore;

  const { fetchPartialProjects } = projectStore;

  useEffect(() => {
    if (!projectId) return;

    const loadOrg = async () => {
      try {
        const project = await projectService.getProjectById(projectId);
        setOrgId(project.orgId);
      } catch (error) {
        console.error("Failed to load project for members:", error);
      }
    };

    loadOrg();

    // Fetch projects if not already fetched
    if (projectStore.fetchStatus === undefined) {
      fetchPartialProjects(workspaceSlug).catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi",
          message: "Không thể tải danh sách dự án",
        })
      );
    }

    if (sprintFetchStatus[projectId] !== "complete") {
      fetchSprintsByProject(projectId).catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi",
          message: "Không thể tải danh sách sprint",
        })
      );
    }

    if (issueFetchStatus[projectId] !== "complete") {
      fetchIssuesByProject(projectId).catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi",
          message: "Không thể tải danh sách công việc",
        })
      );
    }

    if (statusFetchStatus[projectId] !== "complete") {
      fetchIssueStatusesByProject(projectId).catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi",
          message: "Không thể tải danh sách trạng thái",
        })
      );
    }
  }, [
    projectId,
    projectService,
    workspaceSlug,
    projectStore.fetchStatus,
    sprintFetchStatus,
    fetchSprintsByProject,
    issueFetchStatus,
    fetchIssuesByProject,
    statusFetchStatus,
    fetchIssueStatusesByProject,
    fetchPartialProjects,
  ]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!orgId) return;
      try {
        let page = 0;
        const size = 200;
        let totalPages = 1;
        const collected: { id: string; name: string; email?: string }[] = [];

        while (page < totalPages) {
          const res = await identityService.getOrgMembers(orgId, page, size);
          totalPages = res.totalPages || 1;
          res.items?.forEach((m) => {
            collected.push({
              id: m.id,
              name: m.display_name || m.email || "User",
              email: m.email,
            });
          });
          page += 1;
        }

        setMembers(collected);
      } catch (error) {
        console.error("Failed to load members:", error);
      } finally {
      }
    };

    fetchMembers();
  }, [identityService, orgId]);

  const project = projectId ? projectStore.getPartialProjectById(projectId) : undefined;
  const issueStatuses = getIssueStatusesForProject(projectId);

  const handleUnimplemented = () => UNIMPLEMENTED_TOAST();

  const handleCreateIssue = async (sectionId: string, name: string) => {
    if (!projectId) {
      const error = new Error("Thiếu thông tin dự án");
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: error.message,
      });
      throw error;
    }

    const sprintId = sectionId === "backlog" ? null : sectionId;

    try {
      const issue = await issueStore.createIssue({
        projectId,
        sprintId,
        parentId: null,
        name,
        description: null,
        descriptionHtml: null,
        priority: "MEDIUM",
        type: "TASK",
        point: null,
        sequenceId: null,
        sortOrder: null,
        startDate: null,
        targetDate: null,
        assignees: [],
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã tạo công việc",
        message: issue.name,
      });
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ?? error?.message ?? "Không thể tạo công việc. Vui lòng thử lại.";
      const finalMessage = typeof apiMessage === "string" ? apiMessage : "Không thể tạo công việc. Vui lòng thử lại.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: finalMessage,
      });
      throw new Error(finalMessage);
    }
  };

  const handleIssueDrop = async (payload: BacklogIssueDropPayload) => {
    if (!projectId) return;

    try {
      await issueStore.reorderIssue(projectId, payload);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? "Không thể sắp xếp công việc. Vui lòng thử lại.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: typeof message === "string" ? message : "Không thể sắp xếp công việc",
      });
    }
  };

  const handleUpdateIssue = async (issueId: string, data: Partial<IIssue>) => {
    try {
      await issueStore.updateIssue(issueId, data);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã cập nhật công việc",
        message: "Mô tả đã được lưu.",
      });
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ?? error?.message ?? "Không thể cập nhật công việc. Vui lòng thử lại.";
      const finalMessage =
        typeof apiMessage === "string" ? apiMessage : "Không thể cập nhật công việc. Vui lòng thử lại.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: finalMessage,
      });
      throw new Error(finalMessage);
    }
  };

  const handleCreateSprint = async (payload: IBacklogCreateSprintPayload) => {
    if (!projectId) {
      const error = new Error("Thiếu thông tin dự án");
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: error.message,
      });
      throw error;
    }

    try {
      const sprint = await createSprint({
        projectId,
        name: payload.name,
        goal: payload.goal ?? null,
        startDate: payload.startDate ?? null,
        endDate: payload.endDate ?? null,
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã tạo sprint",
        message: sprint.name,
      });
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message ?? error?.message ?? "Không thể tạo sprint. Vui lòng thử lại.";
      const finalMessage = typeof apiMessage === "string" ? apiMessage : "Không thể tạo sprint. Vui lòng thử lại.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: finalMessage,
      });
      throw new Error(finalMessage);
    }
  };

  const handleOpenStartSprint = (sprintId: string, issueCount: number) => {
    setStartSprintState({ sprintId, issueCount });
    setIsStartModalOpen(true);
  };

  const handleOpenCompleteSprint = (sprintId: string) => {
    setCompleteSprintId(sprintId);
    setIsCompleteModalOpen(true);
  };

  const handleCloseStartSprint = () => {
    setIsStartModalOpen(false);
    setStartSprintState(null);
  };

  const sprintToStart = startSprintState ? sprintStore.getSprintById(startSprintState.sprintId) : undefined;

  const handleConfirmStartSprint = async (values: {
    name: string;
    startDate: string;
    endDate: string;
    goal: string | null;
  }) => {
    if (!projectId || !startSprintState) return;
    const sprintId = startSprintState.sprintId;

    try {
      await sprintStore.updateSprint(sprintId, {
        projectId,
        name: values.name,
        status: "ACTIVE",
        startDate: values.startDate,
        endDate: values.endDate,
        goal: values.goal,
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Sprint đã được bắt đầu",
        message: values.name,
      });

      handleCloseStartSprint();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ?? error?.message ?? "Không thể bắt đầu sprint. Vui lòng thử lại.";
      const finalMessage = typeof apiMessage === "string" ? apiMessage : "Không thể bắt đầu sprint. Vui lòng thử lại.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: finalMessage,
      });
      throw new Error(finalMessage);
    }
  };

  const projectIssues = issueStore.getIssuesForProject(projectId);

  const issuesGroupedBySprint = useMemo(() => {
    const grouped = new Map<string | null, IIssue[]>();
    projectIssues.forEach((issue) => {
      const key = issue.sprintId ?? null;
      const existing = grouped.get(key);
      if (existing) existing.push(issue);
      else grouped.set(key, [issue]);
    });
    return grouped;
  }, [projectIssues]);

  const sprintSections = useMemo(() => {
    const sprints = getSprintsForProject(projectId);
    return sprints.map<IBacklogSectionData>((sprint) => ({
      id: sprint.id,
      name: sprint.name,
      type: "sprint",
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      issues: issuesGroupedBySprint.get(sprint.id) ?? [],
    }));
  }, [getSprintsForProject, issuesGroupedBySprint, projectId]);

  const backlogSection = useMemo<IBacklogSectionData>(
    () => ({
      id: "backlog",
      name: "Backlog",
      type: "backlog",
      goal: null,
      startDate: null,
      endDate: null,
      issues: issuesGroupedBySprint.get(null) ?? [],
    }),
    [issuesGroupedBySprint]
  );

  const sections = useMemo(() => [...sprintSections, backlogSection], [backlogSection, sprintSections]);

  const issueLoader = getIssueLoader(projectId);
  const sprintLoader = getSprintLoader(projectId);
  const statusLoader = getStatusLoader(projectId);
  const isLoading = projectId
    ? [issueLoader, sprintLoader, statusLoader].some((loader) => loader === "init-loader" || loader === undefined)
    : false;

  const projectTitle = project?.name ?? "Backlog";

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-custom-text-300">Dự án</p>
            <h1 className="text-2xl font-semibold text-custom-text-100">{projectTitle}</h1>
            <p className="text-sm text-custom-text-300">
              Quản lý backlog, lập kế hoạch sprint và ưu tiên công việc cho đội ngũ của bạn.
            </p>
          </div>
        </div>
        <ProjectTabs workspaceSlug={workspaceSlug} projectId={projectId} active="backlog" />
      </header>

      <BacklogView
        sections={sections}
        projectIdentifier={project?.identifier ?? null}
        isLoading={isLoading}
        onCreateIssue={handleCreateIssue}
        onIssueDrop={handleIssueDrop}
        onCompleteSprint={handleOpenCompleteSprint}
        onCreateSprint={handleCreateSprint}
        onStartSprint={handleOpenStartSprint}
        onUpdateIssue={handleUpdateIssue}
        workspaceSlug={workspaceSlug}
        members={members}
        issueStatuses={issueStatuses}
        sprints={getSprintsForProject(projectId)}
      />

      <StartSprintModal
        isOpen={isStartModalOpen && Boolean(sprintToStart)}
        sprintName={sprintToStart?.name ?? ""}
        issueCount={startSprintState?.issueCount ?? 0}
        initialGoal={sprintToStart?.goal ?? null}
        initialStartDate={sprintToStart?.startDate ?? null}
        initialEndDate={sprintToStart?.endDate ?? null}
        onClose={handleCloseStartSprint}
        onConfirm={handleConfirmStartSprint}
      />

      <CompleteSprintModal
        projectId={projectId}
        activeSprints={getSprintsForProject(projectId)}
        issues={projectIssues}
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        members={members}
      />
    </div>
  );
});

export default ProjectBacklogPage;
