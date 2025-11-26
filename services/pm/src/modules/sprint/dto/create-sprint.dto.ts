import { IsNotEmpty, IsString, IsUUID, IsOptional, IsDateString, IsEnum } from "class-validator";
import { SprintStatus } from "@prisma/client";

export class CreateSprintDto {
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
