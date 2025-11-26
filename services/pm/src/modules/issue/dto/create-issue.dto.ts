import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsDateString, IsArray } from "class-validator";
import { IssueState } from "../enums/issue-state.enum";
import { IssuePriority } from "../enums/issue-priority.enum";
import { IssueType } from "../enums/issue-type.enum";

export class CreateIssueDto {
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionHtml?: string;

  @IsNotEmpty()
  @IsEnum(IssueState)
  state: IssueState;

  @IsNotEmpty()
  @IsEnum(IssuePriority)
  priority: IssuePriority;

  @IsNotEmpty()
  @IsEnum(IssueType)
  type: IssueType;

  @IsOptional()
  @IsNumber()
  point?: number;

  @IsOptional()
  @IsNumber()
  sequenceId?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  assignees?: string[];
}
