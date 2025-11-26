import { IsNotEmpty, IsString, MaxLength, IsUUID, IsOptional } from "class-validator";

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  orgId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsUUID()
  projectLead?: string;

  @IsOptional()
  @IsUUID()
  defaultAssignee?: string;
}
