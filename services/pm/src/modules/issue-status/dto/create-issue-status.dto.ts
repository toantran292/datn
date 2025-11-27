import { IsNotEmpty, IsOptional, IsString, IsInt, Matches } from "class-validator";

export class CreateIssueStatusDto {
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: "Color must be a valid hex color (e.g., #FF0000)" })
  color: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
