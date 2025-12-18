import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
  MinLength,
  IsObject,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmbeddingSourceType } from '../../database/entities/document-embedding.entity';

// UUID-like pattern (accepts any 8-4-4-4-12 hex format, not just strict UUID versions)
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SearchRequestDto {
  @ApiProperty({
    description: 'Search query',
    example: 'What is the project deadline?',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  query: string;

  @ApiPropertyOptional({
    description: 'Namespace ID to search within',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Matches(UUID_PATTERN, { message: 'namespaceId must be a valid UUID format' })
  @IsOptional()
  namespaceId?: string;

  @ApiPropertyOptional({
    description: 'Multiple namespace IDs to search across',
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
  })
  @IsArray()
  @Matches(UUID_PATTERN, { each: true, message: 'each namespaceId must be a valid UUID format' })
  @IsOptional()
  namespaceIds?: string[];

  @ApiPropertyOptional({
    description: 'Namespace type filter',
    example: 'room',
  })
  @IsString()
  @IsOptional()
  namespaceType?: string;

  @ApiPropertyOptional({
    description: 'Organization ID filter',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Matches(UUID_PATTERN, { message: 'orgId must be a valid UUID format' })
  @IsOptional()
  orgId?: string;

  @ApiPropertyOptional({
    description: 'Source types to filter',
    enum: ['message', 'attachment', 'document', 'file'],
    isArray: true,
    example: ['message', 'document'],
  })
  @IsArray()
  @IsEnum(['message', 'attachment', 'document', 'file'], { each: true })
  @IsOptional()
  sourceTypes?: EmbeddingSourceType[];

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    example: 10,
    default: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Minimum similarity score (0-1)',
    example: 0.7,
    default: 0.7,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  minSimilarity?: number;
}

export class AskRequestDto extends SearchRequestDto {
  @ApiPropertyOptional({
    description: 'Custom system prompt for LLM',
    example: 'You are a helpful assistant that answers questions about project documentation.',
  })
  @IsString()
  @IsOptional()
  customPrompt?: string;

  @ApiPropertyOptional({
    description: 'LLM model configuration',
    example: { modelName: 'gpt-4o-mini', temperature: 0.7, maxTokens: 2000 },
  })
  @IsObject()
  @IsOptional()
  llmConfig?: {
    modelName?: string;
    temperature?: number;
    maxTokens?: number;
  };

  @ApiPropertyOptional({
    description: 'Whether to stream the response',
    example: false,
    default: false,
  })
  @IsOptional()
  stream?: boolean;
}

export class SearchResultItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  namespaceId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  orgId: string;

  @ApiProperty({ enum: ['message', 'attachment', 'document', 'file'] })
  sourceType: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  sourceId: string;

  @ApiProperty({ example: 'This is the matched content...' })
  content: string;

  @ApiProperty({ example: 0 })
  chunkIndex: number;

  @ApiProperty({ example: { fileName: 'report.pdf' } })
  metadata: Record<string, any>;

  @ApiProperty({ example: 0.92 })
  similarity: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;
}

export class SearchResponseDto {
  @ApiProperty({ type: [SearchResultItemDto] })
  results: SearchResultItemDto[];

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 'project deadline' })
  query: string;
}

export class AskSourceDto {
  @ApiProperty({ enum: ['message', 'attachment', 'document', 'file'] })
  type: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Relevant content excerpt...' })
  content: string;

  @ApiProperty({ example: 0.92 })
  score: number;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}

export class AskResponseDto {
  @ApiProperty({ example: 'Based on the documents, the project deadline is January 31st, 2025.' })
  answer: string;

  @ApiProperty({ type: [AskSourceDto] })
  sources: AskSourceDto[];

  @ApiProperty({ example: 0.85 })
  confidence: number;
}
