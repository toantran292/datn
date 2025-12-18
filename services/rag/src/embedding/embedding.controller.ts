import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmbeddingService } from './embedding.service';
import {
  IndexDocumentRequestDto,
  IndexShortTextRequestDto,
  IndexResponseDto,
  DeleteResponseDto,
  StatsResponseDto,
} from './dto/index.dto';
import { EmbeddingSourceType } from '../database/entities/document-embedding.entity';

@Controller('embeddings')
@ApiTags('embeddings')
export class EmbeddingController {
  constructor(private readonly embeddingService: EmbeddingService) {}

  @Post('index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Index a document',
    description: 'Index a document by generating embeddings and storing them for semantic search. Large documents will be chunked.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document indexed successfully',
    type: IndexResponseDto,
  })
  async indexDocument(@Body() dto: IndexDocumentRequestDto): Promise<IndexResponseDto> {
    const result = await this.embeddingService.indexDocument(
      {
        namespaceId: dto.namespaceId,
        namespaceType: dto.namespaceType,
        orgId: dto.orgId,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        content: dto.content,
        metadata: dto.metadata,
      },
      {
        chunkSize: dto.chunkSize,
        chunkOverlap: dto.chunkOverlap,
      },
    );

    return {
      success: true,
      chunksCreated: result.chunksCreated,
      message: `Document indexed with ${result.chunksCreated} chunks`,
    };
  }

  @Post('index-short')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Index a short text',
    description: 'Index a short text (like a message) without chunking. Skips if already indexed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Text indexed successfully',
    type: IndexResponseDto,
  })
  async indexShortText(@Body() dto: IndexShortTextRequestDto): Promise<IndexResponseDto> {
    await this.embeddingService.indexShortText({
      namespaceId: dto.namespaceId,
      namespaceType: dto.namespaceType,
      orgId: dto.orgId,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      content: dto.content,
      metadata: dto.metadata,
    });

    return {
      success: true,
      chunksCreated: 1,
      message: 'Short text indexed',
    };
  }

  @Delete('source/:sourceType/:sourceId')
  @ApiOperation({
    summary: 'Delete embeddings by source',
    description: 'Delete all embeddings for a specific source document/message',
  })
  @ApiParam({ name: 'sourceType', enum: ['message', 'attachment', 'document', 'file'] })
  @ApiParam({ name: 'sourceId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Embeddings deleted',
    type: DeleteResponseDto,
  })
  async deleteBySource(
    @Param('sourceType') sourceType: EmbeddingSourceType,
    @Param('sourceId') sourceId: string,
  ): Promise<DeleteResponseDto> {
    const deleted = await this.embeddingService.deleteBySource(sourceType, sourceId);
    return { success: true, deleted };
  }

  @Delete('namespace/:namespaceId')
  @ApiOperation({
    summary: 'Delete embeddings by namespace',
    description: 'Delete all embeddings for a namespace (e.g., all embeddings in a room)',
  })
  @ApiParam({ name: 'namespaceId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Embeddings deleted',
    type: DeleteResponseDto,
  })
  async deleteByNamespace(
    @Param('namespaceId') namespaceId: string,
  ): Promise<DeleteResponseDto> {
    const deleted = await this.embeddingService.deleteByNamespace(namespaceId);
    return { success: true, deleted };
  }

  @Get('stats/:namespaceId')
  @ApiOperation({
    summary: 'Get namespace stats',
    description: 'Get embedding statistics for a namespace',
  })
  @ApiParam({ name: 'namespaceId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Namespace statistics',
    type: StatsResponseDto,
  })
  async getStats(@Param('namespaceId') namespaceId: string): Promise<StatsResponseDto> {
    return this.embeddingService.getNamespaceStats(namespaceId);
  }
}
