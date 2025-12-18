import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsNumber } from 'class-validator';

export class SimilaritySearchDto {
  @ApiProperty({ description: 'Search query text' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Maximum number of results', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Minimum similarity score (0-1)', default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number;
}

export class SimilarIssueDto {
  @ApiProperty({ description: 'Issue ID' })
  id: string;

  @ApiProperty({ description: 'Issue name' })
  name: string;

  @ApiProperty({ description: 'Issue description' })
  description: string | null;

  @ApiProperty({ description: 'Issue type' })
  type: string;

  @ApiProperty({ description: 'Issue priority' })
  priority: string;

  @ApiProperty({ description: 'Story points' })
  point: number | null;

  @ApiProperty({ description: 'Cosine similarity score (0-1)' })
  similarity: number;
}

export class BatchUpdateEmbeddingsDto {
  @ApiPropertyOptional({ description: 'Batch size', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  batchSize?: number;
}

export class GenerateEmbeddingDto {
  @ApiProperty({ description: 'Issue ID to generate embedding for' })
  @IsString()
  issueId: string;
}
