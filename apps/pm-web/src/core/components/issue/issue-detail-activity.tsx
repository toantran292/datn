"use client";

import { CommentList } from "@/core/components/comments";

interface IssueDetailActivityProps {
  issueId: string;
  projectId: string;
  disabled?: boolean;
  currentUserId?: string;
}

export const IssueDetailActivity: React.FC<IssueDetailActivityProps> = ({
  issueId,
  projectId,
  disabled = false,
  currentUserId,
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
          <CommentList issueId={issueId} projectId={projectId} disabled={disabled} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
};
