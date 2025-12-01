import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/projects/:projectId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('charts/work-items')
  async getWorkItemsChart(
    @Param('projectId') projectId: string,
    @Query() query: any,
  ) {
    return this.analyticsService.getCreatedVsResolvedChart(projectId, query);
  }

  @Get('stats')
  async getStats(@Param('projectId') projectId: string) {
    return this.analyticsService.getIssueStats(projectId);
  }
}

