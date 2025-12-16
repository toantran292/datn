import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, LlmProvider, ReportStatus } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty({ description: 'Report name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Report description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ReportType, description: 'Report type' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({ enum: LlmProvider, description: 'LLM provider' })
  @IsEnum(LlmProvider)
  @IsOptional()
  llmProvider?: LlmProvider;

  @ApiPropertyOptional({ description: 'LLM model name' })
  @IsString()
  @IsOptional()
  llmModel?: string;

  @ApiPropertyOptional({ description: 'Custom prompt for report generation' })
  @IsString()
  @IsOptional()
  prompt?: string;

  @ApiPropertyOptional({ description: 'Source file IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  fileIds?: string[];

  @ApiPropertyOptional({ description: 'Additional configuration' })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

export class ReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: ReportType })
  type: ReportType;

  @ApiProperty({ enum: ReportStatus })
  status: ReportStatus;

  @ApiPropertyOptional({ enum: LlmProvider })
  llmProvider?: LlmProvider;

  @ApiPropertyOptional()
  llmModel?: string;

  @ApiPropertyOptional()
  prompt?: string;

  @ApiPropertyOptional()
  content?: string;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiProperty({ type: [String] })
  fileIds: string[];

  @ApiProperty()
  config: Record<string, any>;

  @ApiPropertyOptional()
  tokenUsage?: Record<string, any>;

  @ApiProperty()
  createdAt: string;

  @ApiPropertyOptional()
  startedAt?: string;

  @ApiPropertyOptional()
  completedAt?: string;
}

export class ReportStatusResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ReportStatus })
  status: ReportStatus;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiPropertyOptional()
  startedAt?: string;

  @ApiPropertyOptional()
  completedAt?: string;
}

export class ReportTypeInfoDto {
  @ApiProperty({ enum: ReportType })
  type: ReportType;

  @ApiProperty()
  description: string;
}

export class PagedReportsResponseDto {
  @ApiProperty({ type: [ReportResponseDto] })
  items: ReportResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class ExportReportQueryDto {
  @ApiProperty({ enum: ['PDF', 'DOCX', 'MARKDOWN', 'HTML'], description: 'Export format' })
  @IsString()
  @IsOptional()
  format?: string;

  @ApiPropertyOptional({ description: 'Include metadata in export', default: true })
  @IsOptional()
  includeMetadata?: string;
}

export class ExportFormatInfoDto {
  @ApiProperty({ description: 'Export format code' })
  format: string;

  @ApiProperty({ description: 'MIME type for the format' })
  mimeType: string;

  @ApiProperty({ description: 'File extension' })
  extension: string;
}
