"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button, setToast, TOAST_TYPE } from "@uts/design-system/ui";
import { useAIRefine } from "@/core/hooks/use-ai-refine";
import { AIRefineModal } from "./ai-refine-modal";
import type { IssueType, IssuePriority, RefineDescriptionData } from "@/core/types/ai";

export interface AIRefineButtonProps {
  issueId: string;
  currentDescription: string;
  issueName: string;
  issueType: IssueType;
  priority: IssuePriority;
  projectName?: string;
  sprintGoal?: string;
  onSuccess?: (refinedDescription: string) => void;
  disabled?: boolean;
  className?: string;
}

export const AIRefineButton: React.FC<AIRefineButtonProps> = ({
  issueId,
  currentDescription,
  issueName,
  issueType,
  priority,
  projectName,
  sprintGoal,
  onSuccess,
  disabled = false,
  className,
}) => {
  const { refine, isRefining, error } = useAIRefine();
  const [showModal, setShowModal] = useState(false);
  const [refinedData, setRefinedData] = useState<RefineDescriptionData | null>(null);

  const handleRefine = async () => {
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
      issueId,
      currentDescription,
      issueName,
      issueType,
      priority,
      context: {
        projectName,
        sprintGoal,
      },
    });

    if (result) {
      setRefinedData(result);
      setShowModal(true);
    } else {
      // Error toast
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi AI Refine",
        message: error || "Không thể refine description. Vui lòng thử lại.",
      });
    }
  };

  const handleApply = (refined: string) => {
    onSuccess?.(refined);
    setShowModal(false);
    setRefinedData(null);

    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Đã cập nhật",
      message: "Description đã được cập nhật với AI refinement.",
    });
  };

  const handleCancel = () => {
    setShowModal(false);
    setRefinedData(null);
  };

  return (
    <>
      <Button
        variant="neutral-primary"
        size="sm"
        onClick={handleRefine}
        disabled={disabled || isRefining || !currentDescription}
        className={className}
      >
        <Sparkles className="size-3.5" />
        {isRefining ? "Đang xử lý..." : "AI Refine"}
      </Button>

      {showModal && refinedData && (
        <AIRefineModal
          original={currentDescription}
          refined={refinedData}
          onApply={handleApply}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};
