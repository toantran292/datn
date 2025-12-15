"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button, EModalPosition, EModalWidth, ModalCore } from "@uts/design-system/ui";
import type { RefineDescriptionData } from "@/core/types/ai";
import { AIImprovementsList } from "./ai-improvements-list";

export interface AIRefineModalProps {
  original: string;
  refined: RefineDescriptionData;
  onApply: (refinedDescription: string) => void;
  onCancel: () => void;
}

type TabType = "original" | "refined";

export const AIRefineModal: React.FC<AIRefineModalProps> = ({
  original,
  refined,
  onApply,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("refined");

  const handleApply = () => {
    onApply(refined.refinedDescription);
  };

  return (
    <ModalCore isOpen handleClose={onCancel} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-custom-border-200">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-custom-primary-100/10 grid place-items-center">
              <Sparkles className="size-5 text-custom-primary-100" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-custom-text-100">AI Refined Description</h2>
              <p className="text-sm text-custom-text-300">
                Độ tin cậy: {Math.round(refined.confidence * 100)}%
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="size-8 rounded grid place-items-center hover:bg-custom-background-80 transition-colors"
          >
            <X className="size-4 text-custom-text-300" />
          </button>
        </div>

        {/* Improvements List */}
        {refined.improvements && refined.improvements.length > 0 && (
          <div className="px-5 pt-4 pb-3 bg-custom-background-90 border-b border-custom-border-200">
            <p className="text-sm font-medium text-custom-text-200 mb-2">Cải thiện:</p>
            <AIImprovementsList improvements={refined.improvements} variant="default" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-custom-border-200 px-5">
          <button
            onClick={() => setActiveTab("refined")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "refined"
                ? "border-custom-primary-100 text-custom-primary-100"
                : "border-transparent text-custom-text-300 hover:text-custom-text-200"
            }`}
          >
            Refined
          </button>
          <button
            onClick={() => setActiveTab("original")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "original"
                ? "border-custom-primary-100 text-custom-primary-100"
                : "border-transparent text-custom-text-300 hover:text-custom-text-200"
            }`}
          >
            Original
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === "refined" ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div
                className="text-custom-text-200"
                dangerouslySetInnerHTML={{ __html: refined.refinedDescriptionHtml }}
              />
            </div>
          ) : (
            <div className="text-sm text-custom-text-300 whitespace-pre-wrap font-mono bg-custom-background-90 p-4 rounded-md">
              {original}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-custom-border-200 bg-custom-background-100">
          <div className="text-xs text-custom-text-400">
            {refined.refinedDescription.length} ký tự • Model: {refined.confidence > 0.8 ? "High confidence" : "Medium confidence"}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={onCancel}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply}>
              Apply Changes
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
};
