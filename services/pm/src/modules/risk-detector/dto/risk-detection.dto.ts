import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsBoolean,
} from 'class-validator';

// ============================================================================
// Enums
// ============================================================================

export enum RiskSeverity {
  CRITICAL = 'CRITICAL',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum RiskAlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum RiskType {
  OVERCOMMITMENT = 'OVERCOMMITMENT',
  BLOCKED_ISSUES = 'BLOCKED_ISSUES',
  ZERO_PROGRESS = 'ZERO_PROGRESS',
  MISSING_ESTIMATES = 'MISSING_ESTIMATES',
  WORKLOAD_IMBALANCE = 'WORKLOAD_IMBALANCE',
  VELOCITY_DECLINE = 'VELOCITY_DECLINE',
  CIRCULAR_DEPENDENCIES = 'CIRCULAR_DEPENDENCIES',
}

// ============================================================================
// Response DTOs
// ============================================================================

export class RiskRecommendationDto {
  @ApiProperty({ description: 'Recommendation priority (1 is highest)', example: 1 })
  priority: number;

  @ApiProperty({ description: 'Action to take (Vietnamese)' })
  action: string;

  @ApiPropertyOptional({ description: 'Expected impact of this action' })
  expectedImpact?: string;

  @ApiPropertyOptional({ description: 'Effort estimate', example: '5 minutes' })
  effortEstimate?: string;

  @ApiPropertyOptional({
    description: 'Suggested issue IDs to act on',
    type: [String],
  })
  suggestedIssues?: string[];
}

export class RiskAlertDto {
  @ApiProperty({ description: 'Risk alert ID' })
  id: string;

  @ApiProperty({ description: 'Sprint ID' })
  sprintId: string;

  @ApiProperty({ description: 'Project ID' })
  projectId: string;

  @ApiProperty({
    description: 'Risk type',
    enum: RiskType,
    example: RiskType.OVERCOMMITMENT,
  })
  riskType: string;

  @ApiProperty({
    description: 'Risk severity',
    enum: RiskSeverity,
    example: RiskSeverity.CRITICAL,
  })
  severity: RiskSeverity;

  @ApiProperty({ description: 'Risk title' })
  title: string;

  @ApiProperty({ description: 'Risk description (Vietnamese)' })
  description: string;

  @ApiPropertyOptional({ description: 'Impact score (0-10)', example: 9 })
  impactScore?: number;

  @ApiProperty({
    description: 'Alert status',
    enum: RiskAlertStatus,
    example: RiskAlertStatus.ACTIVE,
  })
  status: RiskAlertStatus;

  @ApiPropertyOptional({
    description: 'Affected issue IDs',
    type: [String],
  })
  affectedIssues?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'When risk was detected' })
  detectedAt: string;

  @ApiPropertyOptional({ description: 'AI-generated recommendations' })
  recommendations?: RiskRecommendationDto[];
}

export class RiskSummaryDto {
  @ApiProperty({ description: 'Total number of active risks' })
  total: number;

  @ApiProperty({ description: 'Number of critical risks' })
  critical: number;

  @ApiProperty({ description: 'Number of medium risks' })
  medium: number;

  @ApiProperty({ description: 'Number of low risks' })
  low: number;
}

export class GetSprintRisksResponseDto {
  @ApiProperty({ description: 'Success flag' })
  success: boolean;

  @ApiProperty({ description: 'Risk alerts', type: [RiskAlertDto] })
  risks: RiskAlertDto[];

  @ApiProperty({ description: 'Risk summary' })
  summary: RiskSummaryDto;
}

export class DetectRisksResponseDto {
  @ApiProperty({ description: 'Success flag' })
  success: boolean;

  @ApiProperty({ description: 'Number of new risks detected' })
  detectedRisks: number;

  @ApiProperty({ description: 'Detected risk alerts', type: [RiskAlertDto] })
  risks: RiskAlertDto[];
}

// ============================================================================
// Request DTOs
// ============================================================================

export class GetSprintRisksQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by severity',
    enum: RiskSeverity,
  })
  @IsOptional()
  @IsEnum(RiskSeverity)
  severity?: RiskSeverity;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: RiskAlertStatus,
  })
  @IsOptional()
  @IsEnum(RiskAlertStatus)
  status?: RiskAlertStatus;

  @ApiPropertyOptional({
    description: 'Include recommendations in response',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeRecommendations?: boolean;
}

export class AcknowledgeRiskDto {
  @ApiPropertyOptional({ description: 'Optional note' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ResolveRiskDto {
  @ApiProperty({ description: 'Resolution description' })
  @IsNotEmpty()
  @IsString()
  resolution: string;

  @ApiPropertyOptional({
    description: 'Actions taken to resolve',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actionsTaken?: string[];
}

export class DismissRiskDto {
  @ApiProperty({ description: 'Reason for dismissing' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ApplyRecommendationDto {
  @ApiPropertyOptional({ description: 'Optional note about applying this recommendation' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ApplyRecommendationResponseDto {
  @ApiProperty({ description: 'Success flag' })
  success: boolean;

  @ApiProperty({ description: 'Recommendation ID' })
  recommendationId: string;

  @ApiProperty({ description: 'Number of issues moved' })
  issuesMoved: number;

  @ApiPropertyOptional({ description: 'IDs of issues that were moved', type: [String] })
  movedIssueIds?: string[];
}

// ============================================================================
// Health Score DTOs
// ============================================================================

export class HealthScoreBreakdownDto {
  @ApiProperty({ description: 'Commitment score (0-100)', example: 85 })
  commitment: number;

  @ApiProperty({ description: 'Progress score (0-100)', example: 72 })
  progress: number;

  @ApiProperty({ description: 'Velocity score (0-100)', example: 80 })
  velocity: number;

  @ApiProperty({ description: 'Quality score (0-100)', example: 90 })
  quality: number;

  @ApiProperty({ description: 'Balance score (0-100)', example: 88 })
  balance: number;
}

export class SprintHealthScoreDto {
  @ApiProperty({ description: 'Overall health score (0-100)', example: 78 })
  overall: number;

  @ApiProperty({ description: 'Score breakdown' })
  breakdown: HealthScoreBreakdownDto;

  @ApiProperty({
    description: 'Grade',
    enum: ['A', 'B', 'C', 'D', 'F'],
    example: 'C',
  })
  grade: string;

  @ApiProperty({
    description: 'Health status',
    enum: ['HEALTHY', 'AT_RISK', 'CRITICAL'],
    example: 'AT_RISK',
  })
  status: string;
}

export class SprintInfoDto {
  @ApiProperty({ description: 'Sprint ID' })
  id: string;

  @ApiProperty({ description: 'Sprint name' })
  name: string;

  @ApiProperty({ description: 'Start date' })
  startDate: string;

  @ApiProperty({ description: 'End date' })
  endDate: string;

  @ApiProperty({
    description: 'Sprint status',
    enum: ['ACTIVE', 'COMPLETED', 'PLANNED'],
    example: 'ACTIVE',
  })
  status: string;
}

export class GetSprintHealthResponseDto {
  @ApiProperty({ description: 'Success flag' })
  success: boolean;

  @ApiProperty({ description: 'Sprint info' })
  sprint: SprintInfoDto;

  @ApiProperty({ description: 'Health score data' })
  health: SprintHealthScoreDto;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: string;
}

export class HealthSnapshotDto {
  @ApiProperty({ description: 'Snapshot date' })
  date: string;

  @ApiProperty({ description: 'Overall health score' })
  healthScore: number;

  @ApiProperty({ description: 'Score breakdown' })
  breakdown: HealthScoreBreakdownDto;

  @ApiProperty({ description: 'Active risks count' })
  activeRisksCount: number;
}

export class GetHealthHistoryResponseDto {
  @ApiProperty({ description: 'Success flag' })
  success: boolean;

  @ApiProperty({
    description: 'Health snapshots',
    type: [HealthSnapshotDto],
  })
  snapshots: HealthSnapshotDto[];
}
