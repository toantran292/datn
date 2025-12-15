import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueType, IssuePriority } from './refine-description.dto';

class EstimateContextDto {
  @ApiPropertyOptional({ description: 'Project name for context' })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiPropertyOptional({ description: 'Current sprint goal' })
  @IsOptional()
  @IsString()
  sprintGoal?: string;
}

export class EstimatePointsDto {
  @ApiProperty({ description: 'Issue ID' })
  @IsNotEmpty()
  @IsString()
  issueId: string;

  @ApiProperty({ description: 'Issue name/title' })
  @IsNotEmpty()
  @IsString()
  issueName: string;

  @ApiProperty({ enum: IssueType, description: 'Issue type' })
  @IsNotEmpty()
  @IsEnum(IssueType)
  issueType: IssueType;

  @ApiProperty({ enum: IssuePriority, description: 'Issue priority' })
  @IsNotEmpty()
  @IsEnum(IssuePriority)
  priority: IssuePriority;

  @ApiProperty({ description: 'Current issue description (plain text or HTML)' })
  @IsNotEmpty()
  @IsString()
  currentDescription: string;

  @ApiPropertyOptional({ description: 'Number of acceptance criteria items', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  acceptanceCriteriaCount?: number;

  @ApiPropertyOptional({ type: EstimateContextDto, description: 'Additional context' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EstimateContextDto)
  context?: EstimateContextDto;
}

class EstimationFactorDto {
  @ApiProperty({ description: 'Factor name (e.g., "Technical Complexity")' })
  factor: string;

  @ApiProperty({ description: 'Impact level', enum: ['Low', 'Medium', 'High'] })
  impact: 'Low' | 'Medium' | 'High';

  @ApiProperty({ description: 'Detailed explanation of this factor' })
  description: string;
}

class EstimationReasoningDto {
  @ApiProperty({ description: 'Summary of estimation reasoning (1-2 sentences)' })
  summary: string;

  @ApiProperty({ type: [EstimationFactorDto], description: 'Factors considered in estimation' })
  factors: EstimationFactorDto[];

  @ApiPropertyOptional({ type: [String], description: 'Recommendations to improve clarity' })
  recommendations?: string[];
}

class AlternativeEstimateDto {
  @ApiProperty({ description: 'Alternative story points value' })
  points: number;

  @ApiProperty({ description: 'Likelihood of this being valid (0.0-1.0)' })
  likelihood: number;

  @ApiProperty({ description: 'Reason why this could be valid' })
  reason: string;
}

export class EstimatePointsDataDto {
  @ApiProperty({ description: 'Suggested story points (Fibonacci: 1,2,3,5,8,13,21)' })
  suggestedPoints: number;

  @ApiProperty({ description: 'Confidence level (0.0-1.0)', minimum: 0, maximum: 1 })
  confidence: number;

  @ApiProperty({ type: EstimationReasoningDto, description: 'Detailed reasoning' })
  reasoning: EstimationReasoningDto;

  @ApiPropertyOptional({ type: [AlternativeEstimateDto], description: 'Alternative estimations' })
  alternatives?: AlternativeEstimateDto[];
}

export class EstimatePointsResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiPropertyOptional({ type: EstimatePointsDataDto, description: 'Estimation data' })
  data?: EstimatePointsDataDto;

  @ApiPropertyOptional({ description: 'Metadata about AI processing' })
  metadata?: {
    model: string;
    tokensUsed: number;
    processingTime: number;
  };

  @ApiPropertyOptional({ description: 'Error details if failed' })
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
