import { IsString, IsUUID, IsEnum, IsOptional, MinLength, MaxLength, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IssueType {
  BUG = 'BUG',
  STORY = 'STORY',
  TASK = 'TASK',
  EPIC = 'EPIC',
}

export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class RefineDescriptionContextDto {
  @ApiPropertyOptional({ description: 'Project name for context' })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiPropertyOptional({ description: 'Current sprint goal' })
  @IsOptional()
  @IsString()
  sprintGoal?: string;
}

export class RefineDescriptionDto {
  @ApiProperty({ description: 'Issue ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  issueId: string;

  @ApiProperty({
    description: 'Current issue description',
    example: 'fix bug login',
    minLength: 5,
    maxLength: 10000,
  })
  @IsString()
  @MinLength(5, { message: 'Description must be at least 5 characters long' })
  @MaxLength(10000, { message: 'Description cannot exceed 10,000 characters' })
  currentDescription: string;

  @ApiProperty({ description: 'Issue name/title', example: 'Fix login bug' })
  @IsString()
  @MinLength(1)
  issueName: string;

  @ApiProperty({
    description: 'Issue type',
    enum: IssueType,
    example: IssueType.BUG,
  })
  @IsEnum(IssueType)
  issueType: IssueType;

  @ApiProperty({
    description: 'Issue priority',
    enum: IssuePriority,
    example: IssuePriority.HIGH,
  })
  @IsEnum(IssuePriority)
  priority: IssuePriority;

  @ApiPropertyOptional({
    description: 'Additional context for AI',
    type: RefineDescriptionContextDto,
  })
  @IsOptional()
  @IsObject()
  context?: RefineDescriptionContextDto;
}
