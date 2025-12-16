import { IsArray, IsString, IsOptional } from "class-validator";

export class UpdateMemberProjectsDto {
  @IsArray()
  @IsString({ each: true })
  projectIds: string[];

  @IsOptional()
  @IsString()
  role?: string;
}
