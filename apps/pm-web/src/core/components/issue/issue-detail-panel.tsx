"use client";

import { useState, useEffect } from "react";
import { Sparkles, Languages } from "lucide-react";
import { Button, setToast, TOAST_TYPE } from "@uts/design-system/ui";
import { IIssue } from "@/core/types/issue";
import { formatIssueKey } from "@/core/components/backlog/utils";
import { IssueDetailHeader } from "./issue-detail-header";
import { IssueDetailProperties } from "./issue-detail-properties";
import { IssueDetailActivity } from "./issue-detail-activity";
import { IssueTitleInput } from "./issue-title-input";
import { IssueDescription } from "./issue-description";
import { AIRefineSection, AIBreakdownSection, AIGeneratingButton, AITranslateSection } from "@/core/components/ai";
import { useAIRefineStream } from "@/core/hooks/use-ai-refine-stream";
import { useAIBreakdown } from "@/core/hooks/use-ai-breakdown";
import { useAITranslateStream, LANGUAGE_LABELS, type TranslateLanguage, type TranslateData } from "@/core/hooks/use-ai-translate-stream";
import { useIssue } from "@/core/hooks/store/use-issue";
import type { RefineDescriptionData, BreakdownData, SubTask } from "@/core/types/ai";

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

  // Stores
  const issueStore = useIssue();

  // AI Refine state (with streaming)
  const { refine, isRefining, streamedText, streamedHtml, error } = useAIRefineStream();
  const [refinedData, setRefinedData] = useState<RefineDescriptionData | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // AI Breakdown state
  const { breakdown, isBreakingDown, error: breakdownError } = useAIBreakdown();
  const [breakdownData, setBreakdownData] = useState<BreakdownData | null>(null);
  const [isCreatingSubTasks, setIsCreatingSubTasks] = useState(false);

  // AI Translate state
  const { translate, isTranslating, streamedHtml: translatedStreamedHtml, error: translateError } = useAITranslateStream();
  const [translatedData, setTranslatedData] = useState<TranslateData | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<TranslateLanguage>("en");

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
    setDescriptionKey((prev) => prev + 1);
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

  const handleRegenerate = async () => {
    setIsRegenerating(true);

    const currentDescription = issue.description || issue.descriptionHtml || "";

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
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi Regenerate",
        message: error || "Không thể regenerate. Vui lòng thử lại.",
      });
    }

    setIsRegenerating(false);
  };

  const handleBreakdown = async () => {
    const currentDescription = issue.description || issue.descriptionHtml || "";

    // Validate description
    if (!currentDescription || currentDescription.trim().length < 20) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Mô tả quá ngắn",
        message: "Vui lòng nhập ít nhất 20 ký tự để sử dụng AI breakdown.",
      });
      return;
    }

    // Check if this is an Epic or large Story
    if (issue.type !== "EPIC" && (issue.point === null || issue.point < 13)) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Issue quá nhỏ",
        message: "AI Breakdown chỉ dành cho Epic hoặc Story lớn (≥13 points).",
      });
      return;
    }

    const result = await breakdown({
      issueId: issue.id,
      issueName: issue.name,
      issueType: issue.type,
      priority: issue.priority,
      currentDescription,
      context: {
        projectName: projectIdentifier || undefined,
      },
    });

    if (result) {
      setBreakdownData(result);
    } else {
      // Error toast
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi AI Breakdown",
        message: breakdownError || "Không thể breakdown issue. Vui lòng thử lại.",
      });
    }
  };

  const handleApplyBreakdown = async (subTasks: SubTask[]) => {
    setIsCreatingSubTasks(true);
    setBreakdownData(null);

    try {
      // Create sub-tasks sequentially to maintain order
      const createdIssues: IIssue[] = [];
      let successCount = 0;
      let failCount = 0;

      for (const subTask of subTasks) {
        try {
          const newIssue = await issueStore.createIssue({
            projectId: issue.projectId,
            sprintId: issue.sprintId || undefined,
            parentId: issue.id, // Set parent to current issue
            name: subTask.name,
            description: subTask.description,
            descriptionHtml: subTask.descriptionHtml,
            priority: subTask.priority,
            type: "TASK", // Sub-tasks are always TASK type
            point: subTask.estimatedPoints,
            assignees: [], // No assignees by default
          });

          createdIssues.push(newIssue);
          successCount++;
        } catch (error) {
          console.error(`Failed to create sub-task: ${subTask.name}`, error);
          failCount++;
        }
      }

      // Show result toast
      if (failCount === 0) {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Tạo sub-tasks thành công",
          message: `Đã tạo ${successCount} sub-tasks từ AI breakdown.`,
        });
      } else if (successCount > 0) {
        setToast({
          type: TOAST_TYPE.WARNING,
          title: "Tạo sub-tasks một phần",
          message: `Đã tạo ${successCount}/${subTasks.length} sub-tasks. ${failCount} sub-tasks thất bại.`,
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi tạo sub-tasks",
          message: "Không thể tạo sub-tasks. Vui lòng thử lại.",
        });
      }
    } catch (error) {
      console.error("Failed to create sub-tasks:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi tạo sub-tasks",
        message: "Đã xảy ra lỗi khi tạo sub-tasks. Vui lòng thử lại.",
      });
    } finally {
      setIsCreatingSubTasks(false);
    }
  };

  const handleCancelBreakdown = () => {
    setBreakdownData(null);
  };

  const handleTranslate = async (language: TranslateLanguage) => {
    const currentDescription = issue.description || issue.descriptionHtml || "";

    // Validate description
    if (!currentDescription || currentDescription.trim().length < 5) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Mô tả quá ngắn",
        message: "Vui lòng nhập ít nhất 5 ký tự để sử dụng AI translate.",
      });
      return;
    }

    setSelectedLanguage(language);

    const result = await translate({
      issueId: issue.id,
      currentDescription,
      targetLanguage: language,
      issueName: issue.name,
      issueType: issue.type,
    });

    if (result) {
      setTranslatedData(result);
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi AI Translate",
        message: translateError || "Không thể dịch description. Vui lòng thử lại.",
      });
    }
  };

  const handleCancelTranslate = () => {
    setTranslatedData(null);
  };

  // Check if issue is eligible for breakdown
  const canBreakdown = issue.type === "EPIC" || (issue.point !== null && issue.point >= 13);

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
                  <>
                    {isRefining ? (
                      <AIGeneratingButton disabled />
                    ) : (
                      <Button variant="neutral-primary" size="sm" onClick={handleRefine} disabled={disabled}>
                        <Sparkles className="size-3.5" />
                        AI Refine
                      </Button>
                    )}
                  </>
                )}
              </div>

              {(refinedData || isRefining) && (
                <AIRefineSection
                  original={issue.description || issue.descriptionHtml || ""}
                  refined={refinedData || { refinedDescription: "", refinedDescriptionHtml: "", confidence: 0, improvements: [] }}
                  onApply={handleApplyRefined}
                  onCancel={handleCancelRefined}
                  onRegenerate={!isRefining ? handleRegenerate : undefined}
                  isRegenerating={isRegenerating}
                  streamedText={streamedText}
                  streamedHtml={streamedHtml}
                  isStreaming={isRefining}
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

              {/* AI Translate Section */}
              {!disabled && (issue.description || issue.descriptionHtml) && !translatedData && !isTranslating && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Languages className="size-4 text-custom-text-400" />
                  <span className="text-xs text-custom-text-400">Dịch sang:</span>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(LANGUAGE_LABELS) as TranslateLanguage[]).map((lang) => (
                      <Button
                        key={lang}
                        variant="neutral-primary"
                        size="sm"
                        onClick={() => handleTranslate(lang)}
                        className="text-xs"
                      >
                        {LANGUAGE_LABELS[lang]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {(translatedData || isTranslating) && (
                <AITranslateSection
                  original={issue.description || issue.descriptionHtml || ""}
                  translatedData={translatedData}
                  streamedHtml={translatedStreamedHtml}
                  isTranslating={isTranslating}
                  onChangeLanguage={handleTranslate}
                  onCancel={handleCancelTranslate}
                />
              )}
            </div>

            {/* AI Breakdown Section */}
            {canBreakdown && (
              <div className="space-y-2">
                {!disabled && (issue.description || issue.descriptionHtml) && !breakdownData && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-custom-border-200 bg-custom-primary-100/5">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-custom-text-100">Issue này có thể được chia nhỏ</p>
                      <p className="text-xs text-custom-text-300 mt-0.5">
                        Sử dụng AI để tự động breakdown thành các sub-tasks có cấu trúc
                      </p>
                    </div>
                    {isBreakingDown ? (
                      <AIGeneratingButton disabled />
                    ) : (
                      <Button variant="primary" size="sm" onClick={handleBreakdown} disabled={disabled}>
                        <Sparkles className="size-3.5" />
                        AI Breakdown
                      </Button>
                    )}
                  </div>
                )}

                {breakdownData && (
                  <AIBreakdownSection
                    breakdown={breakdownData}
                    onAccept={handleApplyBreakdown}
                    onCancel={handleCancelBreakdown}
                    isExpanded={true}
                    isCreating={isCreatingSubTasks}
                  />
                )}
              </div>
            )}

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
