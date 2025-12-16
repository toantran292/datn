import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RagService } from './rag.service';
import {
  SimilaritySearchDto,
  SimilarIssueDto,
  BatchUpdateEmbeddingsDto,
  GenerateEmbeddingDto,
} from './dto/rag.dto';

@ApiTags('RAG')
@Controller('rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) {}

  /**
   * Find similar issues using semantic search
   */
  @Post('search')
  @ApiOperation({ summary: 'Search for similar issues using vector similarity' })
  @ApiResponse({
    status: 200,
    description: 'Returns similar issues',
    type: [SimilarIssueDto],
  })
  async searchSimilarIssues(
    @Body() searchDto: SimilaritySearchDto,
  ): Promise<SimilarIssueDto[]> {
    return this.ragService.findSimilarIssues(searchDto);
  }

  /**
   * Generate embedding for a single issue
   */
  @Post('embedding')
  @ApiOperation({ summary: 'Generate embedding for a specific issue' })
  @ApiResponse({ status: 200, description: 'Embedding generated successfully' })
  async generateEmbedding(
    @Body() dto: GenerateEmbeddingDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.ragService.generateAndSaveEmbedding(dto.issueId);
      return {
        success: true,
        message: `Embedding generated for issue ${dto.issueId}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding for issue ${dto.issueId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Batch update embeddings for issues without embeddings
   */
  @Post('batch-update')
  @ApiOperation({
    summary: 'Batch update embeddings for issues without embeddings',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns number of embeddings updated',
  })
  async batchUpdateEmbeddings(
    @Body() dto: BatchUpdateEmbeddingsDto,
  ): Promise<{ updated: number; message: string }> {
    const batchSize = dto.batchSize || 50;

    this.logger.log(`Starting batch embedding update (batch size: ${batchSize})`);

    const updated = await this.ragService.batchUpdateEmbeddings(batchSize);

    return {
      updated,
      message: `Successfully updated ${updated} issue embeddings`,
    };
  }

  /**
   * Get embedding statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get embedding coverage statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns embedding statistics',
  })
  async getStats(): Promise<{
    total: number;
    withEmbedding: number;
    withoutEmbedding: number;
    percentage: number;
  }> {
    return this.ragService.getEmbeddingStats();
  }
}
