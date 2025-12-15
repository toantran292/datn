"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import type { RefineDescriptionData } from "@/core/types/ai";
import { AIImprovementsList } from "./ai-improvements-list";

export interface AIRefineSectionProps {
  original: string;
  refined: RefineDescriptionData;
  onApply: (refinedDescription: string) => void;
  onCancel: () => void;
  isExpanded?: boolean;
}

type TabType = "original" | "refined";

export const AIRefineSection: React.FC<AIRefineSectionProps> = ({
  original,
  refined,
  onApply,
  onCancel,
  isExpanded = true,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("refined");
  const [expanded, setExpanded] = useState(isExpanded);

  const handleApply = () => {
    // Pass HTML format instead of markdown for IssueDescription compatibility
    onApply(refined.refinedDescriptionHtml);
  };

  return (
    <div className="border border-custom-border-200 rounded-lg bg-custom-background-90 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-custom-primary-100/5 border-b border-custom-border-200">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-custom-primary-100/10 grid place-items-center">
            <Sparkles className="size-4 text-custom-primary-100" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-custom-text-100">AI Refined Description</h3>
            <p className="text-xs text-custom-text-300">
              Độ tin cậy: {Math.round(refined.confidence * 100)}%
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="size-7 rounded grid place-items-center hover:bg-custom-background-80 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="size-4 text-custom-text-300" />
          ) : (
            <ChevronDown className="size-4 text-custom-text-300" />
          )}
        </button>
      </div>

      {expanded && (
        <>
          {/* Improvements List */}
          {refined.improvements && refined.improvements.length > 0 && (
            <div className="px-4 py-3 bg-custom-background-100 border-b border-custom-border-200">
              <p className="text-xs font-medium text-custom-text-200 mb-2">Cải thiện:</p>
              <AIImprovementsList improvements={refined.improvements} variant="compact" />
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-custom-border-200 bg-custom-background-100">
            <button
              onClick={() => setActiveTab("refined")}
              className={`flex-1 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "refined"
                  ? "border-custom-primary-100 text-custom-primary-100 bg-custom-primary-100/5"
                  : "border-transparent text-custom-text-300 hover:text-custom-text-200"
              }`}
            >
              Refined
            </button>
            <button
              onClick={() => setActiveTab("original")}
              className={`flex-1 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "original"
                  ? "border-custom-primary-100 text-custom-primary-100 bg-custom-primary-100/5"
                  : "border-transparent text-custom-text-300 hover:text-custom-text-200"
              }`}
            >
              Original
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto px-4 py-3 bg-custom-background-100">
            {activeTab === "refined" ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div
                  className="text-custom-text-200"
                  dangerouslySetInnerHTML={{ __html: refined.refinedDescriptionHtml }}
                />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div
                  className="text-custom-text-200"
                  dangerouslySetInnerHTML={{ __html: original }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-custom-border-200 bg-custom-background-100">
            <div className="text-xs text-custom-text-400">
              {refined.refinedDescription.length} ký tự • Model:{" "}
              {refined.confidence > 0.8 ? "High confidence" : "Medium confidence"}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="neutral-primary" size="sm" onClick={onCancel}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleApply}>
                Áp dụng
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
