import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DocumentProcessorService } from './document-processor.service';
import { EmbeddingService } from '../embedding/embedding.service';
import {
  ProcessDocumentRequestDto,
  ProcessResponseDto,
  SupportedTypesResponseDto,
} from './dto/processor.dto';

@Controller('process')
@ApiTags('process')
export class ProcessorController {
  constructor(
    private readonly processorService: DocumentProcessorService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process and index a document',
    description: 'Process a document (PDF, audio, video, text) and index its content for semantic search',
  })
  @ApiResponse({
    status: 200,
    description: 'Document processed and indexed',
    type: ProcessResponseDto,
  })
  async processDocument(@Body() dto: ProcessDocumentRequestDto): Promise<ProcessResponseDto> {
    // Check if MIME type is supported
    if (!this.processorService.canProcess(dto.mimeType)) {
      return {
        success: false,
        chunksCreated: 0,
        message: `Unsupported file type: ${dto.mimeType}`,
      };
    }

    // Decode base64 content
    const buffer = Buffer.from(dto.content, 'base64');

    // Process the document to extract text chunks
    const chunks = await this.processorService.process(buffer, {
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      size: buffer.length,
      sourceId: dto.sourceId,
      namespaceId: dto.namespaceId,
      orgId: dto.orgId,
      ...dto.metadata,
    });

    if (chunks.length === 0) {
      return {
        success: false,
        chunksCreated: 0,
        message: 'No content extracted from document',
      };
    }

    // Index each chunk
    let totalChunks = 0;
    for (const chunk of chunks) {
      const result = await this.embeddingService.indexDocument({
        namespaceId: dto.namespaceId,
        namespaceType: dto.namespaceType,
        orgId: dto.orgId,
        sourceType: 'document',
        sourceId: dto.sourceId,
        content: chunk.content,
        metadata: {
          ...dto.metadata,
          ...chunk.metadata,
          chunkIndex: chunk.chunkIndex,
          chunkTotal: chunk.chunkTotal,
        },
      });
      totalChunks += result.chunksCreated;
    }

    return {
      success: true,
      chunksCreated: totalChunks,
      message: `Document processed with ${totalChunks} chunks`,
    };
  }

  @Get('supported-types')
  @ApiOperation({
    summary: 'Get supported MIME types',
    description: 'Returns a list of all supported MIME types for document processing',
  })
  @ApiResponse({
    status: 200,
    description: 'List of supported MIME types',
    type: SupportedTypesResponseDto,
  })
  getSupportedTypes(): SupportedTypesResponseDto {
    return {
      types: this.processorService.getSupportedTypes(),
    };
  }
}
