import { IsString, IsOptional } from "class-validator";

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  commentHtml?: string;
}
