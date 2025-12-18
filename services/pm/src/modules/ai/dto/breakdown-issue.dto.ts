import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IssueType, IssuePriority } from './refine-description.dto';

// ============================================================================
// Request DTOs
// ============================================================================

export class BreakdownContextDto {
  @ApiPropertyOptional({ description: 'Project name for domain context' })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiPropertyOptional({ description: 'Current sprint goal' })
  @IsOptional()
  @IsString()
  sprintGoal?: string;

  @ApiPropertyOptional({
    description: 'Technical stack',
    type: [String],
    example: ['React', 'NestJS', 'PostgreSQL'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technicalStack?: string[];

  @ApiPropertyOptional({ description: 'Team size for task sizing' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  teamSize?: number;
}

export class BreakdownConstraintsDto {
  @ApiPropertyOptional({
    description: 'Maximum number of sub-tasks',
    default: 10,
    minimum: 3,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(20)
  maxSubTasks?: number;

  @ApiPropertyOptional({
    description: 'Target story points per task',
    default: 5,
    minimum: 1,
    maximum: 13,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(13)
  targetPointsPerTask?: number;

  @ApiPropertyOptional({
    description: 'Include testing tasks',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeTests?: boolean;

  @ApiPropertyOptional({
    description: 'Include documentation tasks',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDocs?: boolean;
}

export class BreakdownIssueDto {
  @ApiProperty({ description: 'Issue ID (Epic or large Story)' })
  @IsNotEmpty()
  @IsString()
  issueId: string;

  @ApiProperty({ description: 'Issue name/title' })
  @IsNotEmpty()
  @IsString()
  issueName: string;

  @ApiProperty({
    description: 'Issue type',
    enum: IssueType,
    example: IssueType.EPIC,
  })
  @IsNotEmpty()
  @IsEnum(IssueType)
  issueType: IssueType;

  @ApiProperty({
    description: 'Issue priority',
    enum: IssuePriority,
    example: IssuePriority.HIGH,
  })
  @IsNotEmpty()
  @IsEnum(IssuePriority)
  priority: IssuePriority;

  @ApiProperty({ description: 'Current issue description (HTML or plain text)' })
  @IsNotEmpty()
  @IsString()
  currentDescription: string;

  @ApiPropertyOptional({ description: 'Context for breakdown' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BreakdownContextDto)
  context?: BreakdownContextDto;

  @ApiPropertyOptional({ description: 'Constraints for breakdown' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BreakdownConstraintsDto)
  constraints?: BreakdownConstraintsDto;
}

// ============================================================================
// Response DTOs
// ============================================================================

export enum TaskType {
  FEATURE = 'FEATURE',
  TESTING = 'TESTING',
  INFRA = 'INFRA',
  DOCS = 'DOCS',
  BUGFIX = 'BUGFIX',
}

export enum TechnicalLayer {
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  DATABASE = 'DATABASE',
  DEVOPS = 'DEVOPS',
  CROSS = 'CROSS',
}

export class SubTaskDto {
  @ApiProperty({ description: 'Temporary task ID', example: 'task-1' })
  tempId: string;

  @ApiProperty({ description: 'Task title' })
  name: string;

  @ApiProperty({ description: 'Detailed description (plain text)' })
  description: string;

  @ApiProperty({ description: 'HTML formatted description' })
  descriptionHtml: string;

  @ApiProperty({
    description: 'Estimated story points',
    example: 5,
    enum: [1, 2, 3, 5, 8, 13],
  })
  estimatedPoints: number;

  @ApiProperty({ description: 'Why this estimate (Vietnamese)' })
  estimationReasoning: string;

  @ApiProperty({
    description: 'Task classification',
    enum: TaskType,
    example: TaskType.FEATURE,
  })
  taskType: TaskType;

  @ApiProperty({
    description: 'Technical layer',
    enum: TechnicalLayer,
    example: TechnicalLayer.BACKEND,
  })
  technicalLayer: TechnicalLayer;

  @ApiProperty({ description: 'Suggested execution order', example: 1 })
  order: number;

  @ApiProperty({
    description: 'Array of tempIds this task depends on',
    type: [String],
    example: ['task-1'],
  })
  dependencies: string[];

  @ApiProperty({ description: 'Can run in parallel with others?' })
  canParallelize: boolean;

  @ApiProperty({
    description: 'Task priority',
    enum: IssuePriority,
    example: IssuePriority.HIGH,
  })
  priority: IssuePriority;

  @ApiPropertyOptional({
    description: 'Acceptance criteria',
    type: [String],
  })
  acceptanceCriteria?: string[];

  @ApiPropertyOptional({
    description: 'Task tags',
    type: [String],
    example: ['api', 'authentication'],
  })
  tags?: string[];
}

export class CoverageAreaDto {
  @ApiProperty({ description: 'Coverage area name', example: 'Authentication' })
  area: string;

  @ApiProperty({ description: 'Is this area covered?' })
  covered: boolean;

  @ApiProperty({
    description: 'Task tempIds covering this area',
    type: [String],
  })
  tasks: string[];

  @ApiProperty({
    description: 'Completeness score (0-1)',
    example: 0.9,
  })
  completeness: number;
}

export class BreakdownReasoningDto {
  @ApiProperty({ description: 'Summary of breakdown approach (Vietnamese)' })
  summary: string;

  @ApiProperty({
    description: 'Coverage areas analysis',
    type: [CoverageAreaDto],
  })
  coverageAreas: CoverageAreaDto[];

  @ApiProperty({
    description: 'Assumptions made (Vietnamese)',
    type: [String],
  })
  assumptions: string[];

  @ApiProperty({
    description: 'Potential risks identified (Vietnamese)',
    type: [String],
  })
  risks: string[];
}

export class BreakdownValidationDto {
  @ApiProperty({ description: 'Sum of all sub-task points', example: 33 })
  totalPoints: number;

  @ApiProperty({
    description: 'Completeness score (0-1)',
    example: 0.85,
  })
  completeness: number;

  @ApiProperty({
    description: 'Task size balance score (0-1)',
    example: 0.9,
  })
  balanceScore: number;

  @ApiProperty({
    description: 'Coverage percentage',
    example: 85,
  })
  coveragePercentage: number;
}

export class DependencyGraphNodeDto {
  @ApiProperty({ description: 'Node ID (tempId)', example: 'task-1' })
  id: string;

  @ApiProperty({ description: 'Node label', example: 'DB Schema' })
  label: string;
}

export class DependencyGraphEdgeDto {
  @ApiProperty({ description: 'Source node ID', example: 'task-1' })
  from: string;

  @ApiProperty({ description: 'Target node ID', example: 'task-2' })
  to: string;

  @ApiProperty({
    description: 'Edge type',
    enum: ['sequential', 'blocking'],
    example: 'sequential',
  })
  type: 'sequential' | 'blocking';
}

export class DependencyGraphDto {
  @ApiProperty({ description: 'Graph nodes', type: [DependencyGraphNodeDto] })
  nodes: DependencyGraphNodeDto[];

  @ApiProperty({ description: 'Graph edges', type: [DependencyGraphEdgeDto] })
  edges: DependencyGraphEdgeDto[];
}

export class BreakdownDataDto {
  @ApiProperty({
    description: 'Generated sub-tasks',
    type: [SubTaskDto],
  })
  subTasks: SubTaskDto[];

  @ApiProperty({ description: 'Breakdown reasoning' })
  reasoning: BreakdownReasoningDto;

  @ApiProperty({ description: 'Validation metrics' })
  validation: BreakdownValidationDto;

  @ApiPropertyOptional({ description: 'Dependency graph data' })
  dependencyGraph?: DependencyGraphDto;
}

export class BreakdownMetadataDto {
  @ApiProperty({ description: 'AI model used', example: 'gpt-4o-mini' })
  model: string;

  @ApiProperty({ description: 'Tokens consumed', example: 2847 })
  tokensUsed: number;

  @ApiProperty({ description: 'Processing time in milliseconds', example: 3421 })
  processingTime: number;

  @ApiProperty({ description: 'Was result from cache?' })
  cacheHit: boolean;

  @ApiProperty({ description: 'Timestamp', example: '2025-12-16T10:30:45Z' })
  timestamp: string;
}

export class BreakdownResponseDto {
  @ApiProperty({ description: 'Success flag' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Breakdown data' })
  data?: BreakdownDataDto;

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: BreakdownMetadataDto;

  @ApiPropertyOptional({
    description: 'Error details',
  })
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
