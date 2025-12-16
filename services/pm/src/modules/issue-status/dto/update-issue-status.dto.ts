import { IsOptional, IsString, IsInt, Matches } from "class-validator";

export class UpdateIssueStatusDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: "Color must be a valid hex color (e.g., #FF0000)" })
  color?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
