import { IsString, IsUUID, IsOptional, IsEnum, IsInt, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SourceType {
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
}

export enum TaskType {
  BUG = 'bug',
  TASK = 'task',
  STORY = 'story',
  FEATURE = 'feature',
}

export enum TaskPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export class AnalyzeMeetingDto {
  @ApiPropertyOptional({ description: 'Meeting title', example: 'Sprint Planning Meeting' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Project ID', example: 'uuid' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Workspace/Org ID', example: 'uuid' })
  @IsString()
  orgId: string;

  @ApiPropertyOptional({ description: 'Meeting transcript text (if not uploading file)' })
  @IsOptional()
  @IsString()
  transcript?: string;
}

export class TaskPreviewDto {
  @ApiProperty({ description: 'Temporary ID for frontend tracking' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Task title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed task description' })
  @IsString()
  description: string;

  @ApiProperty({ enum: TaskType })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({ description: 'Order/sequence number', example: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ description: 'Estimated story points', example: 5 })
  @IsInt()
  @Min(1)
  @Max(13)
  estimatedPoints: number;

  @ApiPropertyOptional({ description: 'Suggested assignee name' })
  @IsOptional()
  @IsString()
  suggestedAssignee?: string;

  @ApiPropertyOptional({ description: 'Resolved assignee ID' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({ description: 'Dependencies (order numbers)' })
  @IsArray()
  @IsInt({ each: true })
  dependencies: number[];

  @ApiProperty({ description: 'Context from meeting' })
  @IsString()
  context: string;
}

export class AnalyzeMeetingResponseDto {
  @ApiProperty()
  meetingId: string;

  @ApiProperty()
  transcript: string;

  @ApiProperty({ type: [TaskPreviewDto] })
  tasks: TaskPreviewDto[];

  @ApiProperty()
  stats: {
    totalTasks: number;
    totalPoints: number;
    byPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
    byType: {
      bug: number;
      task: number;
      story: number;
      feature: number;
    };
  };
}
