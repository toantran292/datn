import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ToneType {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  MOTIVATIONAL = 'motivational',
}

export enum SprintSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEEDS_IMPROVEMENT = 'needs_improvement',
}

export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class SprintSummaryDto {
  @ApiProperty({
    description: 'Sprint ID to analyze',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  sprintId: string;

  @ApiPropertyOptional({
    description: 'Include detailed metrics in response',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeMetrics?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include AI recommendations',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeRecommendations?: boolean = true;

  @ApiPropertyOptional({
    description: 'Tone of the summary message',
    enum: ToneType,
    default: ToneType.FRIENDLY,
  })
  @IsOptional()
  @IsEnum(ToneType)
  tone?: ToneType = ToneType.FRIENDLY;
}

export class MetricDto {
  @ApiProperty({ description: 'Metric value' })
  value: number;

  @ApiPropertyOptional({ description: 'Percentage change from previous sprint' })
  change?: number;

  @ApiPropertyOptional({ description: 'Unit of measurement', example: '%' })
  unit?: string;
}

export class PositiveHighlightDto {
  @ApiProperty({ description: 'Highlight title' })
  title: string;

  @ApiProperty({ description: 'Detailed description' })
  description: string;

  @ApiPropertyOptional({ description: 'Associated metric', type: MetricDto })
  metric?: MetricDto;
}

export class AreaOfConcernDto {
  @ApiProperty({ description: 'Concern title' })
  title: string;

  @ApiProperty({ description: 'Detailed description' })
  description: string;

  @ApiProperty({ description: 'Severity level', enum: SeverityLevel })
  severity: SeverityLevel;
}

export class RecommendationDto {
  @ApiProperty({ description: 'Recommendation title' })
  title: string;

  @ApiProperty({ description: 'Detailed description' })
  description: string;

  @ApiProperty({ description: 'Whether recommendation is actionable' })
  actionable: boolean;

  @ApiProperty({ description: 'Priority level', enum: PriorityLevel })
  priority: PriorityLevel;
}

export class StrengthDto {
  @ApiProperty({ description: 'Strength title' })
  title: string;

  @ApiProperty({ description: 'Detailed description' })
  description: string;
}

export class SprintOverviewDto {
  @ApiProperty({ description: 'Sprint name' })
  sprintName: string;

  @ApiProperty({ description: 'Sprint start date' })
  startDate: string;

  @ApiProperty({ description: 'Sprint end date' })
  endDate: string;

  @ApiProperty({ description: 'Sprint duration in days' })
  duration: number;

  @ApiProperty({ description: 'Completion rate (0-1)' })
  completionRate: number;

  @ApiProperty({ description: 'Story points completed' })
  velocityScore: number;

  @ApiProperty({ description: 'Overall sentiment', enum: SprintSentiment })
  overallSentiment: SprintSentiment;
}

export class SprintMetadataDto {
  @ApiProperty({ description: 'Total number of issues' })
  totalIssues: number;

  @ApiProperty({ description: 'Number of completed issues' })
  completedIssues: number;

  @ApiProperty({ description: 'Total story points' })
  totalPoints: number;

  @ApiProperty({ description: 'Completed story points' })
  completedPoints: number;

  @ApiProperty({ description: 'Average completion time in hours' })
  averageCompletionTime: number;

  @ApiProperty({ description: 'Number of bugs in sprint' })
  bugCount: number;

  @ApiProperty({ description: 'Velocity trend percentage change' })
  velocityTrend: number;
}

export class SprintSummaryDataDto {
  @ApiProperty({ description: 'Sprint overview', type: SprintOverviewDto })
  overview: SprintOverviewDto;

  @ApiProperty({ description: 'Positive highlights', type: [PositiveHighlightDto] })
  positives: PositiveHighlightDto[];

  @ApiProperty({ description: 'Areas of concern', type: [AreaOfConcernDto] })
  concerns: AreaOfConcernDto[];

  @ApiProperty({ description: 'Recommendations', type: [RecommendationDto] })
  recommendations: RecommendationDto[];

  @ApiProperty({ description: 'Strengths to maintain', type: [StrengthDto] })
  strengths: StrengthDto[];

  @ApiProperty({ description: 'Closing message' })
  closingMessage: string;

  @ApiProperty({ description: 'Sprint metadata', type: SprintMetadataDto })
  metadata: SprintMetadataDto;
}

export class SprintSummaryResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Sprint summary data', type: SprintSummaryDataDto })
  summary: SprintSummaryDataDto;

  @ApiProperty({ description: 'AI confidence score (0-1)' })
  confidence: number;
}
