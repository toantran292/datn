"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { observer } from "mobx-react";
import {
  Button,
  EModalPosition,
  EModalWidth,
  CustomSelect,
  ModalCore,
  setToast,
  TOAST_TYPE,
} from "@uts/design-system/ui";

import { useIssue } from "@/core/hooks/store/use-issue";
import { useSprint } from "@/core/hooks/store/use-sprint";
import { useAISprintSummaryStream } from "@/core/hooks/use-ai-sprint-summary-stream";
import { AISprintSummaryContent } from "@/core/components/ai";
import type { IIssue } from "@/core/types/issue";
import type { ISprint } from "@/core/types/sprint";
import type { SprintSummaryData } from "@/core/types/ai-sprint-summary";

type CompleteSprintModalProps = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  activeSprints: ISprint[];
  issues: IIssue[];
  members?: { id: string; name: string; email?: string }[];
  onCompleted?: (sprintId: string) => void;
  issueStatuses?: { id: string; name: string }[];
};

const CompleteSprintModalComponent: React.FC<CompleteSprintModalProps> = ({
  projectId,
  isOpen,
  onClose,
  activeSprints,
  issues,
  members = [],
  onCompleted,
  issueStatuses = [],
}) => {
  const sprintStore = useSprint();
  const issueStore = useIssue();

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [moveToSprintId, setMoveToSprintId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Sprint Summary state
  const { generateSummary, isGenerating, overview, metadata, positives, concerns, recommendations, strengths, closingMessage } = useAISprintSummaryStream();
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const allProjectSprints = sprintStore.getSprintsForProject(projectId);
  const futureSprints = useMemo(() => allProjectSprints.filter((s) => s.status === "FUTURE"), [allProjectSprints]);

  const memberMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string }>();
    (members ?? []).forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  useEffect(() => {
    if (!selectedSprintId && activeSprints.length > 0) {
      setSelectedSprintId(activeSprints[0].id);
    }
    if (!moveToSprintId) {
      const firstFuture = futureSprints[0]?.id ?? null;
      setMoveToSprintId(firstFuture);
    }
  }, [activeSprints, futureSprints, moveToSprintId, selectedSprintId]);

  const issuesForSelected = useMemo(
    () => issues.filter((i) => i.sprintId === selectedSprintId),
    [issues, selectedSprintId]
  );
  const doneStatusIds = useMemo(() => {
    const keywords = ["DONE", "HOÀN THÀNH", "COMPLETED"];
    return new Set(
      issueStatuses.filter((s) => keywords.some((k) => s.name?.toUpperCase()?.includes(k))).map((s) => s.id)
    );
  }, [issueStatuses]);
  const isDone = (issue: IIssue) => issue.state === "DONE" || doneStatusIds.has(issue.statusId);
  const completedIssues = useMemo(() => issuesForSelected.filter(isDone), [issuesForSelected, doneStatusIds]);
  const openIssues = useMemo(() => issuesForSelected.filter((i) => !isDone(i)), [issuesForSelected, doneStatusIds]);

  useEffect(() => {
    if (openIssues.length === 0) {
      setMoveToSprintId(null);
      return;
    }
    const firstFuture = futureSprints[0]?.id ?? "backlog";
    setMoveToSprintId((prev) => prev ?? firstFuture);
  }, [openIssues.length, futureSprints]);

  const handleComplete = async () => {
    if (!selectedSprintId) return;
    setIsSubmitting(true);

    const completedSprintId = selectedSprintId;

    try {
      // Move open issues
      const targetId = moveToSprintId === "backlog" ? null : moveToSprintId;
      for (const issue of openIssues) {
        await issueStore.updateIssue(issue.id, { sprintId: targetId });
      }
      await sprintStore.updateSprint(selectedSprintId, { projectId, status: "CLOSED" });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã hoàn thành sprint",
        message: "Đang tạo AI Sprint Summary...",
      });

      onCompleted?.(selectedSprintId);

      // Switch to summary view IMMEDIATELY
      setShowSummaryModal(true);
      setIsSubmitting(false); // Allow closing modal during streaming

      // Start streaming in background (DON'T await!)
      generateSummary({
        sprintId: completedSprintId,
        tone: "friendly",
      }).catch((error) => {
        console.error("Failed to generate summary:", error);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Lỗi AI Summary",
          message: "Không thể tạo AI Sprint Summary. Vui lòng thử lại.",
        });
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? "Không thể hoàn thành sprint. Vui lòng thử lại.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: typeof message === "string" ? message : undefined,
      });
      setIsSubmitting(false);
    }
  };

  const handleCloseSummary = () => {
    setShowSummaryModal(false);
    onClose();
  };

  // Build progressive summary data for modal (updates as stream chunks arrive)
  const progressiveSummaryData: SprintSummaryData | null =
    overview && metadata
      ? {
          overview,
          metadata,
          positives,
          concerns,
          recommendations,
          strengths,
          closingMessage,
        }
      : null;

  // Debug logging
  console.log('CompleteSprintModal state:', {
    showSummaryModal,
    isGenerating,
    hasOverview: !!overview,
    hasMetadata: !!metadata,
    hasSummaryData: !!progressiveSummaryData,
  });

  return (
    <>
      <ModalCore
        isOpen={isOpen}
        handleClose={showSummaryModal ? handleCloseSummary : onClose}
        position={EModalPosition.CENTER}
        width={showSummaryModal ? EModalWidth.XXL : EModalWidth.MD}
      >
        {!showSummaryModal ? (
          <div className="space-y-5 p-5">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-custom-primary-50 grid place-items-center">
                <CheckCircle2 className="size-6 text-custom-primary-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-custom-text-100">Hoàn thành sprint</h2>
                <p className="text-sm text-custom-text-300">Chọn sprint và nơi di chuyển các công việc còn mở.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-custom-text-200">Chọn sprint</label>
                <CustomSelect
                  value={selectedSprintId ?? ""}
                  onChange={(val: string) => setSelectedSprintId(val || null)}
                  input
                  optionsClassName="w-[412px]"
                  label={
                    activeSprints.find((s) => s.id === selectedSprintId)?.name ?? activeSprints[0]?.name ?? "Chọn sprint"
                  }
                >
                  {activeSprints.map((s) => (
                    <CustomSelect.Option key={s.id} value={s.id} className="w-full">
                      {s.name}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              </div>

              <div className="rounded-md border border-custom-border-200 bg-custom-background-90 p-3 text-sm text-custom-text-200 space-y-2">
                <div>
                  Sprint này có{" "}
                  <strong className="text-custom-text-100">{completedIssues.length} công việc đã hoàn thành</strong> và{" "}
                  <strong className="text-custom-text-100">{openIssues.length} công việc đang mở</strong>.
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Các công việc hoàn thành sẽ giữ nguyên.</li>
                  <li>
                    Các công việc đang mở sẽ được di chuyển tới lựa chọn bên dưới (sprint mới hoặc Backlog) và giữ trạng
                    thái hiện tại.
                  </li>
                </ul>
                {openIssues.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs text-custom-text-300">
                      {openIssues.length} công việc đang mở sẽ được di chuyển tới lựa chọn bên dưới.
                    </p>
                  </div>
                ) : null}
              </div>

              {openIssues.length > 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-custom-text-200">Di chuyển công việc đang mở tới</label>
                  <CustomSelect
                    value={moveToSprintId ?? futureSprints[0]?.id ?? "backlog"}
                    onChange={(val: string) => setMoveToSprintId(val)}
                    input
                    className="w-full"
                    optionsClassName="w-[412px]"
                    label={
                      moveToSprintId === "backlog"
                        ? "Backlog"
                        : (futureSprints.find((s) => s.id === moveToSprintId)?.name ??
                          futureSprints[0]?.name ??
                          "Chọn đích")
                    }
                  >
                    <CustomSelect.Option value="backlog">Backlog</CustomSelect.Option>
                    {futureSprints.map((s) => (
                      <CustomSelect.Option key={s.id} value={s.id}>
                        {s.name}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleComplete} disabled={isSubmitting || !selectedSprintId}>
                {isSubmitting ? "Đang xử lý..." : "Hoàn thành sprint"}
              </Button>
            </div>
          </div>
        ) : (
          <AISprintSummaryContent
            summary={progressiveSummaryData}
            isLoading={isGenerating}
            onClose={handleCloseSummary}
          />
        )}
      </ModalCore>
    </>
  );
};

export const CompleteSprintModal = observer(CompleteSprintModalComponent);
