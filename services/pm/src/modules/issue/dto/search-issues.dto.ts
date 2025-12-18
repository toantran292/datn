import { IsOptional, IsString, IsBoolean, IsArray, Min, Max, IsNumber } from "class-validator";
import { Type, Transform } from "class-transformer";

export class SearchIssuesDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  useAI?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  priorities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  types?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  statusIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  sprintIds?: string[];

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  noSprint?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class SearchResultDto {
  id: string;
  name: string;
  description?: string;
  type: string;
  priority: string;
  projectId: string; // For routing to issue detail page
  status: {
    id: string;
    name: string;
    color: string;
  };
  similarity?: number; // For AI search results
  createdAt: Date;
  updatedAt: Date;
}

export class SearchIssuesResponseDto {
  results: SearchResultDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  useAI: boolean;
}
