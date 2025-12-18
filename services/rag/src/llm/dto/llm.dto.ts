import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsObject,
  MinLength,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LLMConfigDto {
  @ApiPropertyOptional({ example: 'gpt-4o-mini' })
  @IsString()
  @IsOptional()
  modelName?: string;

  @ApiPropertyOptional({ example: 0.7 })
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  maxTokens?: number;
}

export class ChatMessageDto {
  @ApiProperty({ enum: ['system', 'user', 'assistant'] })
  @IsEnum(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({ example: 'Hello, how can I help you?' })
  @IsString()
  @MinLength(1)
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({ type: [ChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @ApiPropertyOptional({ type: LLMConfigDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => LLMConfigDto)
  config?: LLMConfigDto;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  stream?: boolean;
}

export class ConversationMessageDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Hello everyone!' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  createdAt?: Date | string;
}

export class SummarizeConversationRequestDto {
  @ApiProperty({ type: [ConversationMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationMessageDto)
  messages: ConversationMessageDto[];

  @ApiPropertyOptional({ type: LLMConfigDto })
  @IsObject()
  @IsOptional()
  config?: LLMConfigDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customPrompt?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  stream?: boolean;
}

export class ExtractActionsRequestDto {
  @ApiProperty({ type: [ConversationMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationMessageDto)
  messages: ConversationMessageDto[];

  @ApiPropertyOptional({ type: LLMConfigDto })
  @IsObject()
  @IsOptional()
  config?: LLMConfigDto;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  stream?: boolean;
}

export class SummarizeDocumentRequestDto {
  @ApiProperty({ example: 'This is the document content...' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({ example: 'report.pdf' })
  @IsString()
  documentName: string;

  @ApiPropertyOptional({ type: LLMConfigDto })
  @IsObject()
  @IsOptional()
  config?: LLMConfigDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customPrompt?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  stream?: boolean;
}

export class TranslateRequestDto {
  @ApiProperty({ example: 'Hello, how are you?' })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiProperty({ example: 'Vietnamese' })
  @IsString()
  targetLanguage: string;

  @ApiPropertyOptional({ example: 'English' })
  @IsString()
  @IsOptional()
  sourceLanguage?: string;

  @ApiPropertyOptional({ type: LLMConfigDto })
  @IsObject()
  @IsOptional()
  config?: LLMConfigDto;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  stream?: boolean;
}

export class SummarizeTranscriptionRequestDto {
  @ApiProperty({ example: 'This is the transcription of the audio...' })
  @IsString()
  @MinLength(1)
  transcription: string;

  @ApiProperty({ example: 'meeting-recording.mp3' })
  @IsString()
  fileName: string;

  @ApiPropertyOptional({ type: LLMConfigDto })
  @IsObject()
  @IsOptional()
  config?: LLMConfigDto;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  stream?: boolean;
}

// Response DTOs
export class ChatResponseDto {
  @ApiProperty({ example: 'Hello! I am here to help you.' })
  response: string;
}

export class ActionItemDto {
  @ApiProperty({ example: 'Complete the project report' })
  task: string;

  @ApiPropertyOptional({ example: 'user-123' })
  assignee: string | null;

  @ApiProperty({ enum: ['high', 'medium', 'low'] })
  priority: 'high' | 'medium' | 'low';

  @ApiPropertyOptional({ example: '2024-01-20' })
  deadline: string | null;
}

export class ExtractActionsResponseDto {
  @ApiProperty({ type: [ActionItemDto] })
  items: ActionItemDto[];
}

export class SummarizeResponseDto {
  @ApiProperty({ example: '## Summary\n\nThe conversation discussed...' })
  summary: string;
}

export class TranslateResponseDto {
  @ApiProperty({ example: 'Xin chào, bạn khỏe không?' })
  translation: string;
}
