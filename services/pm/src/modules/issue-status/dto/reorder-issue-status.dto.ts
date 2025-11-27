import { IsNotEmpty, IsArray, IsUUID } from "class-validator";

export class ReorderIssueStatusDto {
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsNotEmpty()
  @IsArray()
  @IsUUID("4", { each: true })
  statusIds: string[];
}

