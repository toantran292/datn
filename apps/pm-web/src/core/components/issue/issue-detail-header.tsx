"use client";

import { Copy, Link2, MoveRight, X } from "lucide-react";
import { Button } from "@uts/design-system/ui";

interface IssueDetailHeaderProps {
  issueKey: string;
  onClose: () => void;
  onCopyLink?: () => void;
}

export const IssueDetailHeader: React.FC<IssueDetailHeaderProps> = ({ issueKey, onClose, onCopyLink }) => {
  return (
    <div className="relative flex items-center justify-between border-b border-custom-border-200 px-5 py-2">
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center text-custom-text-300 transition-colors hover:text-custom-text-200"
          title="Đóng"
        >
          <MoveRight className="size-4" />
        </button>
        <div className="text-sm font-semibold text-custom-text-100">{issueKey}</div>
      </div>
      <div className="flex items-center gap-2">
        {onCopyLink && (
          <button
            onClick={onCopyLink}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-custom-text-300 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100"
            title="Sao chép liên kết"
          >
            <Link2 className="size-4 -rotate-45" />
          </button>
        )}
      </div>
    </div>
  );
};
