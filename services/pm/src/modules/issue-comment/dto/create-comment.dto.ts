import { IsString, IsOptional, IsUUID } from "class-validator";

export class CreateCommentDto {
  @IsUUID()
  issueId: string;

  @IsUUID()
  projectId: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  commentHtml?: string;
}
