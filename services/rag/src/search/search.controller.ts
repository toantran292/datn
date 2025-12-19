import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchRequestDto,
  AskRequestDto,
  SearchResponseDto,
  AskResponseDto,
} from './dto/search.dto';

@Controller('search')
@ApiTags('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Semantic search',
    description: 'Search for semantically similar content across indexed documents and messages',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: SearchResponseDto,
  })
  async search(@Body() dto: SearchRequestDto): Promise<SearchResponseDto> {
    const results = await this.searchService.search(dto.query, {
      namespaceId: dto.namespaceId,
      namespaceIds: dto.namespaceIds,
      namespaceType: dto.namespaceType,
      orgId: dto.orgId,
      sourceTypes: dto.sourceTypes,
      limit: dto.limit,
      minSimilarity: dto.minSimilarity,
    });

    return {
      results: results.map(r => ({
        id: r.id,
        namespaceId: r.namespaceId,
        orgId: r.orgId,
        sourceType: r.sourceType,
        sourceId: r.sourceId,
        content: r.content,
        chunkIndex: r.chunkIndex,
        metadata: r.metadata,
        similarity: r.similarity,
        createdAt: r.createdAt,
      })),
      total: results.length,
      query: dto.query,
    };
  }

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'RAG question answering',
    description: 'Ask a question and get an answer based on indexed content using RAG',
  })
  @ApiResponse({
    status: 200,
    description: 'RAG response with answer and sources',
    type: AskResponseDto,
  })
  async ask(
    @Body() dto: AskRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AskResponseDto | void> {
    // Handle streaming
    if (dto.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const generator = this.searchService.askStream(dto.query, {
        namespaceId: dto.namespaceId,
        namespaceIds: dto.namespaceIds,
        namespaceType: dto.namespaceType,
        orgId: dto.orgId,
        sourceTypes: dto.sourceTypes,
        limit: dto.limit,
        minSimilarity: dto.minSimilarity,
        llmConfig: dto.llmConfig,
        customPrompt: dto.customPrompt,
      });

      for await (const chunk of generator) {
        if (typeof chunk === 'object' && 'type' in chunk) {
          res.write(`event: ${chunk.type}\ndata: ${JSON.stringify(chunk.data)}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
      }

      res.write('event: done\ndata: {}\n\n');
      res.end();
      return;
    }

    // Non-streaming response
    const result = await this.searchService.ask(dto.query, {
      namespaceId: dto.namespaceId,
      namespaceIds: dto.namespaceIds,
      namespaceType: dto.namespaceType,
      orgId: dto.orgId,
      sourceTypes: dto.sourceTypes,
      limit: dto.limit,
      minSimilarity: dto.minSimilarity,
      llmConfig: dto.llmConfig,
      customPrompt: dto.customPrompt,
    });

    return result;
  }
}
