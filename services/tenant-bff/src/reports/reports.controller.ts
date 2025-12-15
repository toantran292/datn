import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  ReportResponseDto,
  ReportStatusResponseDto,
  PagedReportsResponseDto,
  ReportTypeInfoDto,
  ExportReportQueryDto,
  ExportFormatInfoDto,
} from './dto/report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('orgs/:orgId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create and process a new report' })
  @ApiParam({ name: 'orgId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, type: ReportResponseDto })
  async createReport(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateReportDto,
  ): Promise<ReportResponseDto> {
    // In production, extract userId from JWT token
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000001';
    return this.reportsService.createAndProcess(dto, effectiveUserId, orgId);
  }

  @Get()
  @ApiOperation({ summary: 'List reports for organization' })
  @ApiParam({ name: 'orgId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiResponse({ status: 200, type: PagedReportsResponseDto })
  async getReports(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number,
  ): Promise<PagedReportsResponseDto> {
    return this.reportsService.getReports(orgId, page, size);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get available report types' })
  @ApiResponse({ status: 200, type: [ReportTypeInfoDto] })
  getReportTypes(): ReportTypeInfoDto[] {
    return this.reportsService.getReportTypes();
  }

  @Get(':reportId')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiParam({ name: 'orgId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'reportId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  async getReport(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ): Promise<ReportResponseDto> {
    return this.reportsService.getReport(reportId, orgId);
  }

  @Get(':reportId/status')
  @ApiOperation({ summary: 'Get report status' })
  @ApiParam({ name: 'orgId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'reportId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ReportStatusResponseDto })
  async getReportStatus(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ): Promise<ReportStatusResponseDto> {
    return this.reportsService.getReportStatus(reportId, orgId);
  }

  @Delete(':reportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a report' })
  @ApiParam({ name: 'orgId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'reportId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204 })
  async deleteReport(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ): Promise<void> {
    return this.reportsService.deleteReport(reportId, orgId);
  }

  @Post(':reportId/retry')
  @ApiOperation({ summary: 'Retry a failed report' })
  @ApiParam({ name: 'orgId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'reportId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  async retryReport(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ): Promise<ReportResponseDto> {
    return this.reportsService.retryReport(reportId, orgId);
  }

  // Export endpoints (UC17)
  @Get('export/formats')
  @ApiOperation({ summary: 'Get supported export formats' })
  @ApiResponse({ status: 200, type: [ExportFormatInfoDto] })
  getExportFormats(): ExportFormatInfoDto[] {
    return this.reportsService.getExportFormats();
  }

  @Get(':reportId/export')
  @ApiOperation({ summary: 'Export report to specified format' })
  @ApiParam({ name: 'orgId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'reportId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'format', required: false, enum: ['PDF', 'DOCX', 'MARKDOWN', 'HTML'], description: 'Export format (default: PDF)' })
  @ApiQuery({ name: 'includeMetadata', required: false, type: Boolean, description: 'Include metadata in export (default: true)' })
  @ApiProduces('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown', 'text/html')
  @ApiResponse({ status: 200, description: 'Report file download' })
  async exportReport(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Query() query: ExportReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const format = query.format || 'PDF';
    const includeMetadata = query.includeMetadata !== 'false';

    const result = await this.reportsService.exportReport(
      reportId,
      orgId,
      format,
      includeMetadata,
    );

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.buffer.length,
    });

    return new StreamableFile(result.buffer);
  }
}
