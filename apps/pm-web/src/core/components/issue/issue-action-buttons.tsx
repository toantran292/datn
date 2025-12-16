"use client";

import { Layers, Link2, Paperclip, Share2 } from "lucide-react";
import { Button } from "@uts/design-system/ui";

interface IssueActionButtonsProps {
  disabled?: boolean;
}

export const IssueActionButtons: React.FC<IssueActionButtonsProps> = ({ disabled = false }) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline-neutral"
        size="sm"
        className="gap-2"
        disabled={disabled}
        title="Add sub-work item"
      >
        <Layers className="h-4 w-4" />
        <span>Add sub-work item</span>
      </Button>

      <Button
        variant="outline-neutral"
        size="sm"
        className="gap-2"
        disabled={disabled}
        title="Add relation"
      >
        <Share2 className="h-4 w-4" />
        <span>Add relation</span>
      </Button>

      <Button
        variant="outline-neutral"
        size="sm"
        className="gap-2"
        disabled={disabled}
        title="Add link"
      >
        <Link2 className="h-4 w-4" />
        <span>Add link</span>
      </Button>

      <Button
        variant="outline-neutral"
        size="sm"
        className="gap-2"
        disabled={disabled}
        title="Attach"
      >
        <Paperclip className="h-4 w-4" />
        <span>Attach</span>
      </Button>
    </div>
  );
};
