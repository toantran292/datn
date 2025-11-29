"use client";

import { MessageSquare } from "lucide-react";

interface IssueDetailActivityProps {
  issueId: string;
  disabled?: boolean;
  workspaceSlug?: string;
  projectId?: string;
}

export const IssueDetailActivity: React.FC<IssueDetailActivityProps> = ({
  issueId,
  disabled = false,
  workspaceSlug,
  projectId,
}) => {
  return (
    <div className="space-y-4 pt-3">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="text-lg text-custom-text-100">Hoạt động</div>
        <div className="flex items-center gap-2">{/* Filter and sort buttons will go here */}</div>
      </div>

      {/* rendering activity */}
      <div className="space-y-3">
        <div className="min-h-[200px]">
          <div className="space-y-3">
            {/* Comment creation box */}
            {!disabled && (
              <div className="rounded-md border border-custom-border-200 bg-custom-background-100">
                <div className="p-3">
                  <textarea
                    className="w-full resize-none border-0 bg-transparent text-sm text-custom-text-200 placeholder-custom-text-400 outline-none focus:outline-none"
                    placeholder="Thêm bình luận..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center rounded-md border border-custom-border-200 bg-custom-background-100 p-6">
              <MessageSquare className="mb-2 h-8 w-8 text-custom-text-400" />
              <p className="text-sm text-custom-text-400">Chưa có hoạt động nào</p>
              {!disabled && (
                <p className="mt-1 text-xs text-custom-text-400">
                  Hãy là người đầu tiên bình luận về công việc này
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
