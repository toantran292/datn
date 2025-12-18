import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Inject,
  Sse,
  MessageEvent,
  Res,
  Param,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { createHash } from 'crypto';
// TODO: Add authentication when auth module is implemented
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { User } from '@prisma/client';
import { AIService } from './ai.service';
import { AISprintSummaryService } from './ai-sprint-summary.service';
import { DocumentExtractionService } from './document-extraction.service';
import { FileStorageClient } from '../../common/file-storage/file-storage.client';
import {
  RefineDescriptionDto,
  RefineDescriptionResponseDto,
  EstimatePointsDto,
  EstimatePointsResponseDto,
  BreakdownIssueDto,
  BreakdownResponseDto,
  SprintSummaryDto,
  SprintSummaryResponseDto,
  TranslateDescriptionDto,
  CreateDocumentUploadUrlDto,
  CreateDocumentUploadUrlResponseDto,
  ConfirmDocumentUploadDto,
} from './dto';
import { SkipOrgCheck } from '../../common/decorators/skip-org-check.decorator';

@ApiTags('AI')
@Controller('api/ai')
@SkipOrgCheck() // Skip org check for AI endpoints during development
// TODO: Uncomment when auth module is ready
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly aiService: AIService,
    private readonly sprintSummaryService: AISprintSummaryService,
    private readonly documentExtractionService: DocumentExtractionService,
    private readonly fileStorageClient: FileStorageClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post('refine-description')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refine issue description using AI',
    description:
      'Takes a short issue description and returns a refined, structured version using the universal template',
  })
  @ApiResponse({
    status: 200,
    description: 'Description refined successfully',
    type: RefineDescriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  @ApiResponse({
    status: 500,
    description: 'AI service error',
  })
  async refineDescription(
    @Body() dto: RefineDescriptionDto,
    // TODO: Add user parameter when auth is implemented
    // @CurrentUser() user: User,
  ): Promise<RefineDescriptionResponseDto> {
    this.logger.log(
      `Refine request for issue ${dto.issueId}`,
    );

    // Generate cache key
    const cacheKey = this.generateCacheKey(dto);

    // Check cache
    const cached = await this.cacheManager.get<RefineDescriptionResponseDto>(
      cacheKey,
    );

    if (cached) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return cached;
    }

    // Call AI service
    const result = await this.aiService.refineDescription(dto);

    // Cache successful results for 24 hours (86400 seconds)
    if (result.success) {
      await this.cacheManager.set(cacheKey, result, 86400 * 1000);
      this.logger.log(`Cached result for key: ${cacheKey}`);
    }

    return result;
  }

  /**
   * Generate cache key based on issue ID and description hash
   */
  private generateCacheKey(dto: RefineDescriptionDto): string {
    const hash = createHash('sha256')
      .update(dto.currentDescription)
      .digest('hex')
      .substring(0, 16);

    return `ai-refine:${dto.issueId}:${hash}`;
  }

  @Post('estimate-points')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estimate story points for an issue using AI',
    description:
      'Analyzes issue description and provides story point estimation with detailed reasoning',
  })
  @ApiResponse({
    status: 200,
    description: 'Story points estimated successfully',
    type: EstimatePointsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  @ApiResponse({
    status: 500,
    description: 'AI service error',
  })
  async estimatePoints(
    @Body() dto: EstimatePointsDto,
    // TODO: Add user parameter when auth is implemented
    // @CurrentUser() user: User,
  ): Promise<EstimatePointsResponseDto> {
    this.logger.log(
      `Estimate points request for issue ${dto.issueId} (${dto.issueType})`,
    );

    // Generate cache key
    const cacheKey = this.generateEstimateCacheKey(dto);

    // Check cache
    const cached = await this.cacheManager.get<EstimatePointsResponseDto>(
      cacheKey,
    );

    if (cached) {
      this.logger.log(`Cache hit for estimate key: ${cacheKey}`);
      return cached;
    }

    // Call AI service
    const result = await this.aiService.estimateStoryPoints(dto);

    // Cache successful results for 24 hours (86400 seconds)
    if (result.success) {
      await this.cacheManager.set(cacheKey, result, 86400 * 1000);
      this.logger.log(`Cached estimate result for key: ${cacheKey}`);
    }

    return result;
  }

  /**
   * Generate cache key for estimation based on issue ID and description hash
   */
  private generateEstimateCacheKey(dto: EstimatePointsDto): string {
    const hash = createHash('sha256')
      .update(dto.currentDescription + dto.issueType + dto.priority)
      .digest('hex')
      .substring(0, 16);

    return `ai-estimate:${dto.issueId}:${hash}`;
  }

  @Post('breakdown-issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Break down Epic/Story into sub-tasks using AI',
    description:
      'Analyzes issue description and generates a structured breakdown with dependencies, estimates, and coverage analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Issue broken down successfully',
    type: BreakdownResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  @ApiResponse({
    status: 500,
    description: 'AI service error',
  })
  async breakdownIssue(
    @Body() dto: BreakdownIssueDto,
    // TODO: Add user parameter when auth is implemented
    // @CurrentUser() user: User,
  ): Promise<BreakdownResponseDto> {
    this.logger.log(
      `Breakdown request for issue ${dto.issueId} (${dto.issueType})`,
    );

    // Generate cache key
    const cacheKey = this.generateBreakdownCacheKey(dto);

    // Check cache
    const cached = await this.cacheManager.get<BreakdownResponseDto>(
      cacheKey,
    );

    if (cached) {
      this.logger.log(`Cache hit for breakdown key: ${cacheKey}`);
      // Update metadata to indicate cache hit
      if (cached.metadata) {
        cached.metadata.cacheHit = true;
      }
      return cached;
    }

    // Call AI service
    const result = await this.aiService.breakdownEpic(dto);

    // Cache successful results for 24 hours (86400 seconds)
    if (result.success) {
      await this.cacheManager.set(cacheKey, result, 86400 * 1000);
      this.logger.log(`Cached breakdown result for key: ${cacheKey}`);
    }

    return result;
  }

  /**
   * Generate cache key for breakdown based on issue ID and description hash
   */
  private generateBreakdownCacheKey(dto: BreakdownIssueDto): string {
    const hash = createHash('sha256')
      .update(
        dto.currentDescription +
          dto.issueType +
          dto.priority +
          JSON.stringify(dto.constraints || {}),
      )
      .digest('hex')
      .substring(0, 16);

    return `ai-breakdown:${dto.issueId}:${hash}`;
  }

  /**
   * Streaming endpoints using Server-Sent Events (SSE)
   */

  @Post('refine-description-stream')
  @ApiOperation({
    summary: 'Refine issue description with real-time streaming',
    description: 'Streams the refined description word-by-word like ChatGPT',
  })
  @ApiResponse({
    status: 200,
    description: 'Streaming response with text chunks, confidence, and metadata',
    headers: {
      'Content-Type': {
        description: 'text/event-stream',
      },
    },
  })
  async refineDescriptionStream(
    @Body() dto: RefineDescriptionDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Streaming refine request for issue ${dto.issueId}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const chunk of this.aiService.refineDescriptionStream(dto)) {
        // Send SSE format: data: {...}\n\n
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.end();
    } catch (error) {
      this.logger.error('Streaming refine error', error.stack);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: error.message || 'Streaming failed',
      })}\n\n`);
      res.end();
    }
  }

  @Post('estimate-points-stream')
  @Sse()
  @ApiOperation({
    summary: 'Estimate story points with real-time streaming',
    description: 'Streams the estimation analysis word-by-word',
  })
  @ApiResponse({
    status: 200,
    description: 'Streaming response with text chunks, confidence, and metadata',
  })
  async estimatePointsStream(
    @Body() dto: EstimatePointsDto,
  ): Promise<Observable<MessageEvent>> {
    this.logger.log(`Streaming estimate request for issue ${dto.issueId}`);

    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          for await (const chunk of this.aiService.estimateStoryPointsStream(dto)) {
            subscriber.next({
              data: JSON.stringify(chunk),
            } as MessageEvent);
          }
          subscriber.complete();
        } catch (error) {
          this.logger.error('Streaming estimate error', error.stack);
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              message: error.message || 'Streaming failed',
            }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
    });
  }

  @Post('breakdown-issue-stream')
  @Sse()
  @ApiOperation({
    summary: 'Break down Epic/Story with real-time streaming',
    description: 'Streams the breakdown analysis word-by-word',
  })
  @ApiResponse({
    status: 200,
    description: 'Streaming response with text chunks, confidence, and metadata',
  })
  async breakdownIssueStream(
    @Body() dto: BreakdownIssueDto,
  ): Promise<Observable<MessageEvent>> {
    this.logger.log(`Streaming breakdown request for issue ${dto.issueId}`);

    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          for await (const chunk of this.aiService.breakdownEpicStream(dto)) {
            subscriber.next({
              data: JSON.stringify(chunk),
            } as MessageEvent);
          }
          subscriber.complete();
        } catch (error) {
          this.logger.error('Streaming breakdown error', error.stack);
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              message: error.message || 'Streaming failed',
            }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
    });
  }

  /**
   * AI Sprint Summary endpoints
   */

  @Post('sprint-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate AI Sprint Summary',
    description:
      'Analyzes sprint performance and generates comprehensive summary with insights, recommendations, and sentiment-based closing message',
  })
  @ApiResponse({
    status: 200,
    description: 'Sprint summary generated successfully',
    type: SprintSummaryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid sprint ID or insufficient data',
  })
  @ApiResponse({
    status: 404,
    description: 'Sprint not found',
  })
  @ApiResponse({
    status: 500,
    description: 'AI service error',
  })
  async generateSprintSummary(
    @Body() dto: SprintSummaryDto,
  ): Promise<SprintSummaryResponseDto> {
    this.logger.log(`Sprint summary request for sprint ${dto.sprintId}`);

    return await this.sprintSummaryService.generateSprintSummary(dto);
  }

  @Post('sprint-summary-stream')
  @ApiOperation({
    summary: 'Generate AI Sprint Summary with streaming',
    description:
      'Streams sprint summary progressively - overview, metrics, insights, recommendations, and closing message',
  })
  @ApiResponse({
    status: 200,
    description: 'Streaming response with progressive summary sections',
    headers: {
      'Content-Type': {
        description: 'text/event-stream',
      },
    },
  })
  async generateSprintSummaryStream(
    @Body() dto: SprintSummaryDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Streaming sprint summary for sprint ${dto.sprintId}`);

    // Set SSE headers with proper buffering control
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    try {
      for await (const chunk of this.sprintSummaryService.generateSprintSummaryStream(
        dto,
      )) {
        // Send SSE format: data: {...}\n\n
        const data = `data: ${JSON.stringify(chunk)}\n\n`;
        res.write(data);

        // Force flush to ensure immediate delivery
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }
      res.end();
    } catch (error) {
      this.logger.error('Streaming sprint summary error', error.stack);
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: error.message || 'Streaming failed',
        })}\n\n`,
      );
      res.end();
    }
  }

  @Post('translate-description-stream')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Translate issue description using AI with streaming',
    description: 'Translates issue description to target language with real-time streaming',
  })
  async translateDescriptionStream(
    @Body() dto: TranslateDescriptionDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Streaming translate for issue: ${dto.issueId} to ${dto.targetLanguage}`);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const stream = this.aiService.translateDescriptionStream(dto);

      for await (const data of stream) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);

        // Force flush to ensure immediate delivery
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }

      // Send completion signal
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      this.logger.error('Streaming translation error', error.stack);
      res.write(
        `data: ${JSON.stringify({
          error: error.message || 'Translation streaming failed',
        })}\n\n`,
      );
      res.end();
    }
  }

  @Post('documents/upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create presigned URL for document upload',
    description: 'Creates a presigned URL to upload documents (PDF, Word, Excel) for AI processing',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL created successfully',
    type: CreateDocumentUploadUrlResponseDto,
  })
  async createDocumentUploadUrl(
    @Body() dto: CreateDocumentUploadUrlDto,
  ): Promise<CreateDocumentUploadUrlResponseDto> {
    this.logger.log(`Creating presigned URL for document: ${dto.originalName}`);

    try {
      const result = await this.fileStorageClient.createPresignedUrl({
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        size: dto.size,
        service: 'pm',
        modelType: 'document',
        subjectId: dto.projectId || 'auto-create',
        uploadedBy: dto.userId,
        orgId: dto.orgId,
        tags: ['ai-auto-create', 'document'],
        metadata: {
          projectId: dto.projectId,
        },
      });

      return {
        assetId: result.assetId,
        presignedUrl: result.presignedUrl,
        objectKey: result.objectKey,
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      this.logger.error('Failed to create presigned URL', error.stack);
      throw error;
    }
  }

  @Post('documents/confirm-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm document upload completion',
    description: 'Confirms that the document has been successfully uploaded to storage',
  })
  async confirmDocumentUpload(@Body() dto: ConfirmDocumentUploadDto) {
    this.logger.log(`Confirming upload for asset: ${dto.assetId}`);

    try {
      const result = await this.fileStorageClient.confirmUpload(dto.assetId);

      return {
        success: true,
        data: {
          assetId: result.id,
          fileName: result.originalName,
          mimeType: result.mimeType,
          size: result.size,
          uploadStatus: result.uploadStatus,
        },
      };
    } catch (error) {
      this.logger.error('Failed to confirm upload', error.stack);
      throw error;
    }
  }

  @Post('documents/:assetId/extract')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Extract text from uploaded document',
    description: 'Extracts text content from PDF, Word, or Excel documents',
  })
  @ApiResponse({
    status: 200,
    description: 'Text extracted successfully',
  })
  async extractDocumentText(@Param('assetId') assetId: string) {
    this.logger.log(`Extracting text from document: ${assetId}`);

    try {
      const result = await this.documentExtractionService.extractTextFromDocument(assetId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to extract text', error.stack);
      throw error;
    }
  }
}
