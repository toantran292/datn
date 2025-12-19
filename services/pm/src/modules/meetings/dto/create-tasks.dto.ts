import { IsString, IsUUID, IsOptional, IsEnum, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TaskType, TaskPriority } from './analyze-meeting.dto';

export class CreateTaskFromMeetingDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: TaskType })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty()
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(13)
  estimatedPoints: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty()
  @IsArray()
  @IsInt({ each: true })
  dependencies: number[];

  @ApiProperty()
  @IsString()
  context: string;
}

export class BulkCreateTasksDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ type: [CreateTaskFromMeetingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskFromMeetingDto)
  tasks: CreateTaskFromMeetingDto[];
}

export class CreatedTaskDto {
  @ApiProperty()
  tempId: string;

  @ApiProperty()
  issueId: string;

  @ApiProperty()
  issueKey: string;

  @ApiProperty()
  title: string;
}

export class FailedTaskDto {
  @ApiProperty()
  tempId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  error: string;

  @ApiPropertyOptional()
  code?: string;
}

export class BulkCreateTasksResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  stats: {
    total: number;
    succeeded: number;
    failed: number;
  };

  @ApiProperty({ type: [CreatedTaskDto] })
  created: CreatedTaskDto[];

  @ApiProperty({ type: [FailedTaskDto] })
  failed: FailedTaskDto[];
}
