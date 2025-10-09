"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button, EModalPosition, EModalWidth, Input, ModalCore } from "@uts/design-system/ui";

type StartSprintModalProps = {
  isOpen: boolean;
  sprintName: string;
  issueCount: number;
  initialGoal: string | null;
  initialStartDate: string | null;
  initialEndDate: string | null;
  onClose: () => void;
  onConfirm: (payload: {
    name: string;
    startDate: string;
    endDate: string;
    goal: string | null;
  }) => Promise<void>;
};

const formatDate = (value: string | null) => {
  if (!value) return "";
  return value;
};

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (value: string, offset: number) => {
  const base = new Date(value);
  if (Number.isNaN(base.getTime())) return value;
  base.setDate(base.getDate() + offset);
  return base.toISOString().slice(0, 10);
};

export const StartSprintModal: React.FC<StartSprintModalProps> = (props) => {
  const { isOpen, sprintName, issueCount, initialGoal, initialStartDate, initialEndDate, onClose, onConfirm } = props;

  const issueSummaryText = useMemo(() => {
    if (issueCount === 0) return "Không có công việc nào trong sprint này.";
    if (issueCount === 1) return "1 công việc sẽ được bao gồm trong sprint này.";
    return `${issueCount} công việc sẽ được bao gồm trong sprint này.`;
  }, [issueCount]);

  const [name, setName] = useState(sprintName);
  const [startDate, setStartDate] = useState(formatDate(initialStartDate ?? today()));
  const [endDate, setEndDate] = useState(
    formatDate(initialEndDate ?? addDays(initialStartDate ?? today(), 14))
  );
  const [goal, setGoal] = useState(initialGoal ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(sprintName);
      const resolvedStart = initialStartDate ?? today();
      const resolvedEnd = initialEndDate ?? addDays(resolvedStart, 14);
      setStartDate(formatDate(resolvedStart));
      setEndDate(formatDate(resolvedEnd));
      setGoal(initialGoal ?? "");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, sprintName, initialGoal, initialStartDate, initialEndDate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Tên sprint là bắt buộc");
      return;
    }
    if (!startDate) {
      setError("Vui lòng chọn ngày bắt đầu");
      return;
    }
    if (!endDate) {
      setError("Vui lòng chọn ngày kết thúc");
      return;
    }
    if (endDate < startDate) {
      setError("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        name: name.trim(),
        startDate,
        endDate,
        goal: goal.trim() ? goal.trim() : null,
      });
    } catch (submissionError: any) {
      const message = submissionError?.message ?? "Không thể bắt đầu sprint. Vui lòng thử lại.";
      setError(typeof message === "string" ? message : "Không thể bắt đầu sprint. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.MD}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-custom-text-100">Bắt đầu sprint</h2>
          <p className="text-sm text-custom-text-300">{issueSummaryText}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-custom-text-300">
              Tên sprint <span className="text-red-500">*</span>
            </label>
            <Input value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-custom-text-300">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-custom-text-300">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-custom-text-300">Mục tiêu sprint</label>
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="w-full resize-none rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 focus:border-custom-primary-100 focus:outline-none"
              placeholder="Mô tả mục tiêu cho sprint này"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="neutral-primary" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Đang bắt đầu" : "Bắt đầu"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
};
