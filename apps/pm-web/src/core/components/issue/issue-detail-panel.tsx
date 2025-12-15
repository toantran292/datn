"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button, setToast, TOAST_TYPE } from "@uts/design-system/ui";
import { IIssue } from "@/core/types/issue";
import { formatIssueKey } from "@/core/components/backlog/utils";
import { IssueDetailHeader } from "./issue-detail-header";
import { IssueDetailProperties } from "./issue-detail-properties";
import { IssueDetailActivity } from "./issue-detail-activity";
import { IssueTitleInput } from "./issue-title-input";
import { IssueDescription } from "./issue-description";
import { AIRefineSection } from "@/core/components/ai";
import { useAIRefine } from "@/core/hooks/use-ai-refine";
import type { RefineDescriptionData } from "@/core/types/ai";

export interface IssueDetailPanelProps {
  issue: IIssue;
  projectIdentifier?: string | null;
  locationLabel?: string | null;
  workspaceSlug?: string | null;
  onClose: () => void;
  onUpdateIssue?: (issueId: string, data: Partial<IIssue>) => Promise<void>;
}

export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = (props) => {
  const { issue, projectIdentifier, locationLabel, workspaceSlug, onClose, onUpdateIssue } = props;

  const issueKey = formatIssueKey(projectIdentifier, issue.sequenceId);
  const disabled = !onUpdateIssue;

  // AI Refine state
  const { refine, isRefining, error } = useAIRefine();
  const [refinedData, setRefinedData] = useState<RefineDescriptionData | null>(null);

  // Local description state for immediate UI update
  const [localDescription, setLocalDescription] = useState<string>(issue.descriptionHtml || issue.description || "");
  const [descriptionKey, setDescriptionKey] = useState<number>(0);

  // Sync local description with issue prop changes
  useEffect(() => {
    setLocalDescription(issue.descriptionHtml || issue.description || "");
  }, [issue.id, issue.descriptionHtml, issue.description]);

  const handleCopyLink = () => {
    const resolvedWorkspaceSlug =
      workspaceSlug ??
      (() => {
        if (typeof window === "undefined") return "";
        const parts = window.location.pathname.split("/").filter(Boolean);
        return parts[0] ?? "";
      })();
    const workspaceSegment = resolvedWorkspaceSlug ? `/${resolvedWorkspaceSlug}` : "";
    const path = `${workspaceSegment}/project/${issue.projectId}/issue/${issue.id}`;
    const link = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(link);
  };

  const handleUpdateTitle = async (value: string) => {
    if (onUpdateIssue) {
      await onUpdateIssue(issue.id, { name: value });
    }
  };

  const handleUpdateDescription = async (value: string) => {
    if (onUpdateIssue) {
      await onUpdateIssue(issue.id, { descriptionHtml: value });
    }
  };

  const handleRefine = async () => {
    const currentDescription = issue.description || issue.descriptionHtml || "";

    // Validate description
    if (!currentDescription || currentDescription.trim().length < 5) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Mô tả quá ngắn",
        message: "Vui lòng nhập ít nhất 5 ký tự để sử dụng AI refine.",
      });
      return;
    }

    const result = await refine({
      issueId: issue.id,
      currentDescription,
      issueName: issue.name,
      issueType: issue.type,
      priority: issue.priority,
      context: {
        projectName: projectIdentifier || undefined,
      },
    });

    if (result) {
      setRefinedData(result);
    } else {
      // Error toast
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi AI Refine",
        message: error || "Không thể refine description. Vui lòng thử lại.",
      });
    }
  };

  const handleApplyRefined = async (refinedHtml: string) => {
    // Update local state immediately for instant UI update
    setLocalDescription(refinedHtml);
    setDescriptionKey(prev => prev + 1);
    setRefinedData(null);

    // Then update backend
    await handleUpdateDescription(refinedHtml);

    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Đã cập nhật",
      message: "Description đã được cập nhật với AI refinement.",
    });
  };

  const handleCancelRefined = () => {
    setRefinedData(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-custom-background-100">
      <IssueDetailHeader issueKey={issueKey} onClose={onClose} onCopyLink={handleCopyLink} />

      <div className="vertical-scrollbar flex h-full w-full overflow-auto">
        <div className="relative h-full w-full space-y-6 overflow-auto p-4 py-5">
          <div className="space-y-3">
            <IssueTitleInput
              value={issue.name}
              disabled={disabled}
              onChange={handleUpdateTitle}
              containerClassName="-ml-3"
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-custom-text-300">Mô tả</label>
                {!disabled && (issue.description || issue.descriptionHtml) && !refinedData && (
                  <Button variant="neutral-primary" size="sm" onClick={handleRefine} disabled={disabled || isRefining}>
                    <Sparkles className="size-3.5" />
                    {isRefining ? "Đang xử lý..." : "AI Refine"}
                  </Button>
                )}
              </div>

              {refinedData && (
                <AIRefineSection
                  original={issue.description || issue.descriptionHtml || ""}
                  refined={refinedData}
                  onApply={handleApplyRefined}
                  onCancel={handleCancelRefined}
                  isExpanded={true}
                />
              )}

              <IssueDescription
                key={`description-${issue.id}-${descriptionKey}`}
                issueId={issue.id}
                projectId={issue.projectId}
                initialValue={localDescription}
                disabled={disabled}
                onSubmit={handleUpdateDescription}
                containerClassName="-pl-3 border-none"
              />
            </div>

            <IssueDetailProperties
              issue={issue}
              locationLabel={locationLabel}
              disabled={disabled}
              onUpdateIssue={onUpdateIssue}
              projectIdentifier={projectIdentifier ?? null}
              workspaceSlug={workspaceSlug ?? null}
            />

            <IssueDetailActivity issueId={issue.id} projectId={issue.projectId} disabled={disabled} />
          </div>
        </div>
      </div>
    </div>
  );
};
