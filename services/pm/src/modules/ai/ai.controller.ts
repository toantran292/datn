import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { createHash } from 'crypto';
// TODO: Add authentication when auth module is implemented
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { User } from '@prisma/client';
import { AIService } from './ai.service';
import {
  RefineDescriptionDto,
  RefineDescriptionResponseDto,
  EstimatePointsDto,
  EstimatePointsResponseDto,
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
}
