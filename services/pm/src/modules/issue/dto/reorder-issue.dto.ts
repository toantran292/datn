import { IsEnum, IsOptional, IsUUID } from "class-validator";

export enum ReorderPosition {
  BEFORE = "BEFORE",
  AFTER = "AFTER",
  END = "END",
}

export class ReorderIssueDto {
  @IsOptional()
  @IsUUID()
  toSprintId?: string;

  @IsOptional()
  @IsUUID()
  destinationIssueId?: string;

  @IsEnum(ReorderPosition)
  position: ReorderPosition;
}
