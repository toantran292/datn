import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum, IsObject, MinLength, IsNumber } from 'class-validator';
import { EmbeddingSourceType } from '../../database/entities/document-embedding.entity';

export class IndexDocumentRequestDto {
  @ApiProperty({
    description: 'Namespace ID for isolating embeddings (e.g., roomId, projectId)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  namespaceId: string;

  @ApiPropertyOptional({
    description: 'Type of namespace (room, project, workspace)',
    example: 'room',
    default: 'room',
  })
  @IsString()
  @IsOptional()
  namespaceType?: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  orgId: string;

  @ApiProperty({
    description: 'Type of source being indexed',
    enum: ['message', 'attachment', 'document', 'file'],
    example: 'document',
  })
  @IsEnum(['message', 'attachment', 'document', 'file'])
  sourceType: EmbeddingSourceType;

  @ApiProperty({
    description: 'Unique ID of the source document/message',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  sourceId: string;

  @ApiProperty({
    description: 'Text content to be indexed',
    example: 'This is the document content to be embedded for semantic search.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({
    description: 'Additional metadata to store with the embedding',
    example: { fileName: 'report.pdf', author: 'John Doe' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Chunk size for splitting large documents',
    example: 1000,
    default: 1000,
  })
  @IsNumber()
  @IsOptional()
  chunkSize?: number;

  @ApiPropertyOptional({
    description: 'Overlap between chunks',
    example: 200,
    default: 200,
  })
  @IsNumber()
  @IsOptional()
  chunkOverlap?: number;
}

export class IndexShortTextRequestDto {
  @ApiProperty({
    description: 'Namespace ID for isolating embeddings',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  namespaceId: string;

  @ApiPropertyOptional({
    description: 'Type of namespace',
    example: 'room',
  })
  @IsString()
  @IsOptional()
  namespaceType?: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  orgId: string;

  @ApiProperty({
    description: 'Type of source',
    enum: ['message', 'attachment', 'document', 'file'],
    example: 'message',
  })
  @IsEnum(['message', 'attachment', 'document', 'file'])
  sourceType: EmbeddingSourceType;

  @ApiProperty({
    description: 'Unique ID of the source',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  sourceId: string;

  @ApiProperty({
    description: 'Short text content (will not be chunked)',
    example: 'Quick message to be indexed.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class IndexResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 5 })
  chunksCreated: number;

  @ApiPropertyOptional({ example: 'Document indexed successfully' })
  message?: string;
}

export class DeleteResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 5 })
  deleted: number;
}

export class StatsResponseDto {
  @ApiProperty({ example: 150 })
  totalEmbeddings: number;

  @ApiProperty({
    example: { message: 100, document: 50 },
  })
  bySourceType: Record<string, number>;
}
