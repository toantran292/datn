"use client";

import { Layers, Link2, Paperclip, Share2 } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { AIActionButtonsV2 } from "./ai-action-buttons-v2";

interface IssueActionButtonsProps {
  disabled?: boolean;
  issueId?: string;
  showAIActions?: boolean;
}

export const IssueActionButtons: React.FC<IssueActionButtonsProps> = ({
  disabled = false,
  issueId = "demo-issue",
  showAIActions = true,
}) => {
  return (
    <div className="space-y-4">
      {/* AI Actions - Premium Features with Streaming & Regenerate */}
      {showAIActions && (
        <div>
          <AIActionButtonsV2
            issueId={issueId}
            onRefine={(_, payload) => ({
              url: "/api/ai/refine",
              payload,
            })}
            onEstimate={(_, payload) => ({
              url: "/api/ai/estimate",
              payload,
            })}
            onBreakdown={(_, payload) => ({
              url: "/api/ai/breakdown",
              payload,
            })}
          />
        </div>
      )}

      {/* Standard Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="neutral-primary"
          size="sm"
          className="gap-2"
          disabled={disabled}
          title="Add sub-work item"
        >
          <Layers className="h-4 w-4" />
          <span>Add sub-work item</span>
        </Button>

        <Button
          variant="neutral-primary"
          size="sm"
          className="gap-2"
          disabled={disabled}
          title="Add relation"
        >
          <Share2 className="h-4 w-4" />
          <span>Add relation</span>
        </Button>

        <Button
          variant="neutral-primary"
          size="sm"
          className="gap-2"
          disabled={disabled}
          title="Add link"
        >
          <Link2 className="h-4 w-4" />
          <span>Add link</span>
        </Button>

        <Button
          variant="neutral-primary"
          size="sm"
          className="gap-2"
          disabled={disabled}
          title="Attach"
        >
          <Paperclip className="h-4 w-4" />
          <span>Attach</span>
        </Button>
      </div>
    </div>
  );
};
