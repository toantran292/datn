"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumbs, setToast, TOAST_TYPE } from "@uts/design-system/ui";

import { IssueDetailActivity } from "@/core/components/issue/issue-detail-activity";
import { IssueDetailProperties } from "@/core/components/issue/issue-detail-properties";
import { IssueDescription } from "@/core/components/issue/issue-description";
import { IssueTitleInput } from "@/core/components/issue/issue-title-input";
import { formatIssueKey } from "@/core/components/backlog/utils";
import { useIssue } from "@/core/hooks/store/use-issue";
import { useProject } from "@/core/hooks/store/use-project";
import type { IIssue } from "@/core/types/issue";

const IssueDetailPage = observer(() => {
  const params = useParams<{ workspaceSlug?: string | string[]; projectId?: string | string[]; issueId?: string | string[] }>();
  const router = useRouter();
  const issueStore = useIssue();
  const projectStore = useProject();

  const projectIdParam = params?.projectId;
  const workspaceSlugParam = params?.workspaceSlug;
  const issueIdParam = params?.issueId;

  const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] ?? "" : projectIdParam ?? "";
  const workspaceSlug = Array.isArray(workspaceSlugParam) ? workspaceSlugParam[0] ?? "" : workspaceSlugParam ?? "";
  const issueId = Array.isArray(issueIdParam) ? issueIdParam[0] ?? "" : issueIdParam ?? "";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const project = projectStore.getPartialProjectById(projectId);
  const issue = issueId ? issueStore.getIssueById(issueId) : undefined;
  const projectIdentifier = project?.identifier ?? null;
  const issueKey = issue ? formatIssueKey(projectIdentifier, issue.sequenceId) : "Công việc";

  useEffect(() => {
    if (!projectId || !issueId) return;
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (projectStore.fetchStatus === undefined) {
          await projectStore.fetchPartialProjects(workspaceSlug);
        }
        await issueStore.fetchIssueById(issueId);
      } catch (err: any) {
        if (!isMounted) return;
        const apiMessage = err?.response?.data?.message ?? err?.message ?? "Không thể tải chi tiết công việc.";
        const finalMessage = typeof apiMessage === "string" ? apiMessage : "Không thể tải chi tiết công việc.";
        setError(finalMessage);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi",
          message: finalMessage,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [issueId, issueStore, projectId, projectStore, workspaceSlug]);

  const handleUpdateIssue = useCallback(async (id: string, data: Partial<IIssue>) => {
    try {
      await issueStore.updateIssue(id, data);
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message ?? err?.message ?? "Không thể cập nhật công việc.";
      const finalMessage = typeof apiMessage === "string" ? apiMessage : "Không thể cập nhật công việc.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: finalMessage,
      });
      throw err;
    }
  }, [issueStore]);

  const workspaceSegment = workspaceSlug ? `/${workspaceSlug}` : "";
  const breadcrumbProjectHref = `${workspaceSegment}/project/${projectId}/backlog`;

  const breadcrumbProject = (
    <Breadcrumbs.Item
      key="project"
      component={
        <Breadcrumbs.ItemWrapper label={project?.name ?? "Dự án"} type="link">
          <a href={breadcrumbProjectHref} className="flex items-center gap-2 no-underline text-inherit">
            <Breadcrumbs.Label>{project?.name ?? "Dự án"}</Breadcrumbs.Label>
          </a>
        </Breadcrumbs.ItemWrapper>
      }
    />
  );

  const breadcrumbIssue = (
    <Breadcrumbs.Item
      key="issue"
      component={
        <Breadcrumbs.ItemWrapper label={issue?.name ?? issueKey} type="text" isLast>
          <Breadcrumbs.Label>{issueKey}</Breadcrumbs.Label>
        </Breadcrumbs.ItemWrapper>
      }
    />
  );

  const handleBack = () => {
    router.push(breadcrumbProjectHref);
  };

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-custom-border-200 p-10 text-sm text-custom-text-300">
          Đang tải chi tiết công việc...
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
        </div>
      );
    }

    if (!issue) {
      return (
        <div className="rounded-md border border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
          Không tìm thấy công việc.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-md border border-custom-border-200 bg-custom-background-100 p-5">
            <div className="mb-2 text-sm font-medium text-custom-text-300">{issueKey}</div>
            <IssueTitleInput value={issue.name} onChange={(value) => handleUpdateIssue(issue.id, { name: value })} />
            <div className="mt-2">
              <IssueDescription
                issueId={issue.id}
                projectId={issue.projectId}
                initialValue={issue.descriptionHtml || issue.description || ""}
                onSubmit={(value) => handleUpdateIssue(issue.id, { descriptionHtml: value })}
              />
            </div>
          </div>

          <div className="rounded-md border border-custom-border-200 bg-custom-background-100 p-5">
            <IssueDetailActivity issueId={issue.id} projectId={issue.projectId} />
          </div>
        </div>

        <div>
          <IssueDetailProperties
            issue={issue}
            projectIdentifier={projectIdentifier}
            onUpdateIssue={handleUpdateIssue}
            locationLabel={null}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </div>
    );
  }, [error, handleUpdateIssue, isLoading, issue, issueKey, projectIdentifier]);

  return (
    <div className="flex h-full flex-col gap-5 p-6">
      <div className="flex flex-col gap-2">
        <Breadcrumbs onBack={handleBack}>
          {breadcrumbProject}
          {breadcrumbIssue}
        </Breadcrumbs>
        <div className="text-2xl font-semibold text-custom-text-100">{issue?.name ?? "Chi tiết công việc"}</div>
      </div>

      {content}
    </div>
  );
});

export default IssueDetailPage;
