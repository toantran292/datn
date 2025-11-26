import { IssueState } from "../enums/issue-state.enum";
import { IssuePriority } from "../enums/issue-priority.enum";
import { IssueType } from "../enums/issue-type.enum";

export class IssueResponseDto {
  id: string;
  projectId: string;
  sprintId: string | null;
  parentId: string | null;
  name: string;
  description: string | null;
  descriptionHtml: string | null;
  state: IssueState;
  priority: IssuePriority;
  type: IssueType;
  point: number | null;
  sequenceId: number | null;
  sortOrder: number;
  startDate: string | null;
  targetDate: string | null;
  assignees: string[];
  createdAt: Date;
  updatedAt: Date;
}
