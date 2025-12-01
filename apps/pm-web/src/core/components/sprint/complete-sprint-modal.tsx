"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Avatar,
  Badge,
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
import type { IIssue } from "@/core/types/issue";
import type { ISprint } from "@/core/types/sprint";

type CompleteSprintModalProps = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  activeSprints: ISprint[];
  issues: IIssue[];
  members?: { id: string; name: string; email?: string }[];
  onCompleted?: (sprintId: string) => void;
};

export const CompleteSprintModal: React.FC<CompleteSprintModalProps> = ({
  projectId,
  isOpen,
  onClose,
  activeSprints,
  issues,
  members = [],
  onCompleted,
}) => {
  const sprintStore = useSprint();
  const issueStore = useIssue();

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [moveToSprintId, setMoveToSprintId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const futureSprints = useMemo(
    () => sprintStore.getSprintsForProject(projectId).filter((s) => s.status === "FUTURE"),
    [projectId, sprintStore]
  );

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
  const completedIssues = useMemo(() => issuesForSelected.filter((i) => i.state === "DONE"), [issuesForSelected]);
  const openIssues = useMemo(() => issuesForSelected.filter((i) => i.state !== "DONE"), [issuesForSelected]);

  const handleComplete = async () => {
    if (!selectedSprintId) return;
    setIsSubmitting(true);
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
        message: "Các công việc còn lại đã được di chuyển.",
      });
      onCompleted?.(selectedSprintId);
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? "Không thể hoàn thành sprint. Vui lòng thử lại.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi",
        message: typeof message === "string" ? message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
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
              label={
                activeSprints.find((s) => s.id === selectedSprintId)?.name ?? activeSprints[0]?.name ?? "Chọn sprint"
              }
            >
              {activeSprints.map((s) => (
                <CustomSelect.Option key={s.id} value={s.id}>
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

          <div className="space-y-1">
            <label className="text-sm font-medium text-custom-text-200">Di chuyển công việc đang mở tới</label>
            <CustomSelect
              value={moveToSprintId ?? "backlog"}
              onChange={(val: string) => setMoveToSprintId(val)}
              input
              label={
                moveToSprintId === "backlog"
                  ? "Backlog"
                  : (futureSprints.find((s) => s.id === moveToSprintId)?.name ?? "Chọn đích")
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
    </ModalCore>
  );
};
