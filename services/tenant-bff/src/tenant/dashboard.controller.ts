import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { HmacGuard } from '../common/guards/hmac.guard';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard.dto';

@Controller('dashboard')
@UseGuards(HmacGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Req() req): Promise<DashboardResponseDto> {
    const orgId = req.orgId;
    return this.dashboardService.getDashboard(orgId);
  }

  @Get('recent-files')
  async getRecentFiles(
    @Req() req,
    @Query('limit') limit?: string,
  ) {
    const orgId = req.orgId;
    return this.dashboardService.getRecentFiles(orgId, parseInt(limit || '5', 10));
  }
}
