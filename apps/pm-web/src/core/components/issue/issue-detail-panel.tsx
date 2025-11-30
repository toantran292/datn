"use client";

import { IIssue } from "@/core/types/issue";
import { formatIssueKey } from "@/core/components/backlog/utils";
import { IssueDetailHeader } from "./issue-detail-header";
import { IssueDetailProperties } from "./issue-detail-properties";
import { IssueDetailActivity } from "./issue-detail-activity";
import { IssueTitleInput } from "./issue-title-input";
import { IssueDescription } from "./issue-description";

export interface IssueDetailPanelProps {
  issue: IIssue;
  projectIdentifier?: string | null;
  locationLabel?: string | null;
  onClose: () => void;
  onUpdateIssue?: (issueId: string, data: Partial<IIssue>) => Promise<void>;
}

export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = (props) => {
  const { issue, projectIdentifier, locationLabel, onClose, onUpdateIssue } = props;

  const issueKey = formatIssueKey(projectIdentifier, issue.sequenceId);
  const disabled = !onUpdateIssue;

  const handleCopyLink = () => {
    const link = `${window.location.origin}/issue/${issueKey}`;
    navigator.clipboard.writeText(link);
  };

  const handleUpdateTitle = async (value: string) => {
    if (onUpdateIssue) {
      await onUpdateIssue(issue.id, { name: value });
    }
  };

  const handleUpdateDescription = async (value: string) => {
    if (onUpdateIssue) {
      await onUpdateIssue(issue.id, { descriptionHtml: value });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-custom-border-200 bg-custom-background-100">
      <IssueDetailHeader issueKey={issueKey} onClose={onClose} onCopyLink={handleCopyLink} />

      <div className="vertical-scrollbar flex h-full w-full overflow-auto">
        <div className="relative h-full w-full space-y-6 overflow-auto p-4 py-5">
          <div className="space-y-3">
            <IssueTitleInput
              value={issue.name}
              disabled={disabled}
              onChange={handleUpdateTitle}
              containerClassName="-ml-3"
            />

            <IssueDescription
              issueId={issue.id}
              projectId={issue.projectId}
              initialValue={issue.descriptionHtml || issue.description || ""}
              disabled={disabled}
              onSubmit={handleUpdateDescription}
              containerClassName="-pl-3 border-none"
            />

            <IssueDetailProperties
              issue={issue}
              locationLabel={locationLabel}
              disabled={disabled}
              onUpdateIssue={onUpdateIssue}
              projectIdentifier={projectIdentifier ?? null}
            />

            <IssueDetailActivity issueId={issue.id} projectId={issue.projectId} disabled={disabled} />
          </div>
        </div>
      </div>
    </div>
  );
};
