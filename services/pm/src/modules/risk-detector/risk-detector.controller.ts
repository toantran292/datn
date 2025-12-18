import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RiskDetectorService } from './risk-detector.service';
import {
  GetSprintRisksResponseDto,
  DetectRisksResponseDto,
  GetSprintRisksQueryDto,
  AcknowledgeRiskDto,
  ResolveRiskDto,
  DismissRiskDto,
  RiskAlertDto,
  ApplyRecommendationDto,
  ApplyRecommendationResponseDto,
} from './dto';

@ApiTags('Risk Detector')
@Controller('api/risk-detector')
export class RiskDetectorController {
  constructor(private readonly riskDetectorService: RiskDetectorService) {}

  /**
   * GET /api/risk-detector/sprints/:sprintId/risks
   * Get all risks for a sprint
   */
  @Get('sprints/:sprintId/risks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all risks for a sprint' })
  @ApiResponse({
    status: 200,
    description: 'Risk alerts retrieved',
    type: GetSprintRisksResponseDto,
  })
  async getSprintRisks(
    @Param('sprintId') sprintId: string,
    @Query() query: GetSprintRisksQueryDto,
  ): Promise<GetSprintRisksResponseDto> {
    const { risks, summary } = await this.riskDetectorService.getSprintRisks(
      sprintId,
      query,
    );

    return {
      success: true,
      risks,
      summary,
    };
  }

  /**
   * POST /api/risk-detector/sprints/:sprintId/risks/detect
   * Trigger immediate risk detection for a sprint
   */
  @Post('sprints/:sprintId/risks/detect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger risk detection for a sprint' })
  @ApiResponse({
    status: 200,
    description: 'Risk detection completed',
    type: DetectRisksResponseDto,
  })
  async detectSprintRisks(
    @Param('sprintId') sprintId: string,
  ): Promise<DetectRisksResponseDto> {
    // Service now returns complete response with AI analysis
    return await this.riskDetectorService.detectRisksForSprint(sprintId);
  }

  /**
   * PUT /api/risk-detector/risks/:riskId/acknowledge
   * Acknowledge a risk alert
   */
  @Put('risks/:riskId/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge a risk alert' })
  @ApiResponse({
    status: 200,
    description: 'Risk acknowledged',
    type: RiskAlertDto,
  })
  async acknowledgeRisk(
    @Param('riskId') riskId: string,
    @Body() dto: AcknowledgeRiskDto,
    @Req() request: any,
  ): Promise<{ success: boolean; risk: RiskAlertDto }> {
    const userId =
      (request.headers['x-user-id'] as string) ||
      '00000000-0000-0000-0000-000000000000';

    const risk = await this.riskDetectorService.acknowledgeRisk(
      riskId,
      userId,
      dto.note,
    );

    return {
      success: true,
      risk,
    };
  }

  /**
   * PUT /api/risk-detector/risks/:riskId/resolve
   * Mark a risk as resolved
   */
  @Put('risks/:riskId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a risk alert' })
  @ApiResponse({
    status: 200,
    description: 'Risk resolved',
    type: RiskAlertDto,
  })
  async resolveRisk(
    @Param('riskId') riskId: string,
    @Body() dto: ResolveRiskDto,
  ): Promise<{ success: boolean; risk: RiskAlertDto }> {
    const risk = await this.riskDetectorService.resolveRisk(
      riskId,
      dto.resolution,
      dto.actionsTaken,
    );

    return {
      success: true,
      risk,
    };
  }

  /**
   * DELETE /api/risk-detector/risks/:riskId/dismiss
   * Dismiss a risk alert (false positive)
   */
  @Delete('risks/:riskId/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss a risk alert' })
  @ApiResponse({
    status: 200,
    description: 'Risk dismissed',
    type: RiskAlertDto,
  })
  async dismissRisk(
    @Param('riskId') riskId: string,
    @Body() dto: DismissRiskDto,
  ): Promise<{ success: boolean; risk: RiskAlertDto }> {
    const risk = await this.riskDetectorService.dismissRisk(
      riskId,
      dto.reason,
    );

    return {
      success: true,
      risk,
    };
  }

  /**
   * PUT /api/risk-detector/recommendations/:recommendationId/apply
   * Apply a recommendation (auto-execute suggested actions)
   */
  @Put('recommendations/:recommendationId/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a recommendation' })
  @ApiResponse({
    status: 200,
    description: 'Recommendation applied successfully',
    type: ApplyRecommendationResponseDto,
  })
  async applyRecommendation(
    @Param('recommendationId') recommendationId: string,
    @Body() dto: ApplyRecommendationDto,
  ): Promise<ApplyRecommendationResponseDto> {
    const result = await this.riskDetectorService.applyRecommendation(
      recommendationId,
      dto.note,
    );

    return {
      success: true,
      recommendationId,
      issuesMoved: result.issuesMoved,
      movedIssueIds: result.movedIssueIds,
    };
  }
}
