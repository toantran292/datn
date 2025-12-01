import { IssuePriority } from "../enums/issue-priority.enum";
import { IssueType } from "../enums/issue-type.enum";
import { IssueStatusResponseDto } from "../../issue-status/dto/issue-status-response.dto";

export class IssueResponseDto {
  id: string;
  projectId: string;
  sprintId: string | null;
  parentId: string | null;
  statusId: string;
  status?: IssueStatusResponseDto;
  name: string;
  description: string | null;
  descriptionHtml: string | null;
  priority: IssuePriority;
  type: IssueType;
  point: number | null;
  sequenceId: number;
  sortOrder: number;
  startDate: string | null;
  targetDate: string | null;
  assignees: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}
