import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class ProcessDocumentRequestDto {
  @ApiProperty({
    description: 'Namespace ID for the document',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  namespaceId: string;

  @ApiPropertyOptional({
    description: 'Namespace type',
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
    description: 'Source ID of the document',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  sourceId: string;

  @ApiProperty({
    description: 'File name',
    example: 'report.pdf',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'Base64 encoded file content',
    example: 'SGVsbG8gV29ybGQ=',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ProcessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 5 })
  chunksCreated: number;

  @ApiPropertyOptional({ example: 'Document processed and indexed successfully' })
  message?: string;
}

export class SupportedTypesResponseDto {
  @ApiProperty({
    example: ['application/pdf', 'text/plain', 'audio/mpeg', 'video/mp4'],
    isArray: true,
  })
  types: string[];
}
