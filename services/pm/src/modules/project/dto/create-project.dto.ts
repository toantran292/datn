import { IsNotEmpty, IsString, MaxLength, IsUUID, IsOptional, Matches } from "class-validator";

export class CreateProjectDto {
  @IsOptional()
  @IsString()
  orgId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  @Matches(/^[A-Za-z0-9]+$/, { message: "Identifier must contain only alphanumeric characters" })
  identifier?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  projectLead?: string;

  @IsOptional()
  @IsUUID()
  defaultAssignee?: string;
}
