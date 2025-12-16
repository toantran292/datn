import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { LlmService } from '../llm/llm.service';
import {
  Report,
  ReportStatus,
  ReportType,
  LlmProvider,
  ReportTypeDescriptions,
} from './entities/report.entity';
import {
  CreateReportDto,
  ReportResponseDto,
  ReportStatusResponseDto,
  PagedReportsResponseDto,
  ReportTypeInfoDto,
} from './dto/report.dto';
import { ExportService, ExportFormat, ExportResult } from './export';

// In-memory store for demo. In production, use PostgreSQL/MongoDB
const reportsStore = new Map<string, Report>();

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly exportService: ExportService;

  constructor(
    private readonly llmService: LlmService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.exportService = new ExportService();
  }

  async createReport(
    dto: CreateReportDto,
    userId: string,
    orgId: string,
  ): Promise<ReportResponseDto> {
    const report: Report = {
      id: uuidv4(),
      orgId,
      createdBy: userId,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      status: ReportStatus.PENDING,
      llmProvider: dto.llmProvider,
      llmModel: dto.llmModel,
      prompt: dto.prompt,
      fileIds: dto.fileIds || [],
      config: dto.config || {},
      createdAt: new Date(),
    };

    reportsStore.set(report.id, report);
    this.logger.log(`Report created: ${report.id}`);

    return this.toResponseDto(report);
  }

  async processReport(reportId: string): Promise<ReportResponseDto> {
    const report = reportsStore.get(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Report is not pending');
    }

    // Mark as processing
    report.status = ReportStatus.PROCESSING;
    report.startedAt = new Date();
    reportsStore.set(reportId, report);

    try {
      // Build prompt
      const fullPrompt = this.buildPrompt(report);

      // Get document context
      const context = await this.getDocumentContext(report.fileIds);

      // Generate with LLM
      const provider = report.llmProvider || LlmProvider.OPENAI;
      const result = await this.llmService.generate(
        fullPrompt,
        context,
        provider,
        report.llmModel,
      );

      if (result.success) {
        report.status = ReportStatus.COMPLETED;
        report.content = result.content;
        report.tokenUsage = result.usage;
        report.completedAt = new Date();
      } else {
        report.status = ReportStatus.FAILED;
        report.errorMessage = result.error;
        report.completedAt = new Date();
      }
    } catch (error) {
      report.status = ReportStatus.FAILED;
      report.errorMessage = error.message;
      report.completedAt = new Date();
    }

    reportsStore.set(reportId, report);
    return this.toResponseDto(report);
  }

  async createAndProcess(
    dto: CreateReportDto,
    userId: string,
    orgId: string,
  ): Promise<ReportResponseDto> {
    const created = await this.createReport(dto, userId, orgId);
    return this.processReport(created.id);
  }

  async getReport(reportId: string, orgId: string): Promise<ReportResponseDto> {
    const report = reportsStore.get(reportId);
    if (!report || report.orgId !== orgId) {
      throw new NotFoundException('Report not found');
    }
    return this.toResponseDto(report);
  }

  async getReports(
    orgId: string,
    page: number = 0,
    size: number = 20,
  ): Promise<PagedReportsResponseDto> {
    const allReports = Array.from(reportsStore.values())
      .filter((r) => r.orgId === orgId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = allReports.length;
    const totalPages = Math.ceil(total / size);
    const items = allReports.slice(page * size, (page + 1) * size).map((r) => this.toResponseDto(r));

    return { items, page, size, total, totalPages };
  }

  async getReportStatus(reportId: string, orgId: string): Promise<ReportStatusResponseDto> {
    const report = reportsStore.get(reportId);
    if (!report || report.orgId !== orgId) {
      throw new NotFoundException('Report not found');
    }

    return {
      id: report.id,
      status: report.status,
      errorMessage: report.errorMessage,
      startedAt: report.startedAt?.toISOString(),
      completedAt: report.completedAt?.toISOString(),
    };
  }

  async deleteReport(reportId: string, orgId: string): Promise<void> {
    const report = reportsStore.get(reportId);
    if (!report || report.orgId !== orgId) {
      throw new NotFoundException('Report not found');
    }
    reportsStore.delete(reportId);
    this.logger.log(`Report deleted: ${reportId}`);
  }

  async retryReport(reportId: string, orgId: string): Promise<ReportResponseDto> {
    const report = reportsStore.get(reportId);
    if (!report || report.orgId !== orgId) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.FAILED) {
      throw new BadRequestException('Only failed reports can be retried');
    }

    // Reset to pending
    report.status = ReportStatus.PENDING;
    report.content = undefined;
    report.errorMessage = undefined;
    report.tokenUsage = undefined;
    report.startedAt = undefined;
    report.completedAt = undefined;
    reportsStore.set(reportId, report);

    return this.processReport(reportId);
  }

  getReportTypes(): ReportTypeInfoDto[] {
    return Object.values(ReportType).map((type) => ({
      type,
      description: ReportTypeDescriptions[type],
    }));
  }

  private buildPrompt(report: Report): string {
    if (report.prompt) {
      return report.prompt;
    }

    switch (report.type) {
      case ReportType.SUMMARY:
        return 'Please provide a comprehensive summary of the following content. Highlight the key points and main themes.';
      case ReportType.ANALYSIS:
        return 'Please analyze the following content in detail. Provide insights, identify patterns, and offer recommendations.';
      case ReportType.EXTRACTION:
        return 'Please extract the key information from the following content. Organize the extracted data in a structured format.';
      case ReportType.COMPARISON:
        return 'Please compare and contrast the following documents. Identify similarities, differences, and provide a comparative analysis.';
      case ReportType.CUSTOM:
        return 'Please process the following content according to the user\'s requirements.';
      default:
        return 'Please analyze and summarize the following content.';
    }
  }

  private async getDocumentContext(fileIds: string[]): Promise<string> {
    if (!fileIds || fileIds.length === 0) {
      return '';
    }

    // TODO: Fetch document content from file-storage service
    // For now, return placeholder
    const fileStorageUrl = this.config.get<string>('FILE_STORAGE_URL', 'http://localhost:3002');

    this.logger.log(`Would fetch documents from ${fileStorageUrl} for files: ${fileIds.join(', ')}`);

    return `[Document content would be fetched from file-storage service for files: ${fileIds.join(', ')}]`;
  }

  private toResponseDto(report: Report): ReportResponseDto {
    return {
      id: report.id,
      orgId: report.orgId,
      createdBy: report.createdBy,
      name: report.name,
      description: report.description,
      type: report.type,
      status: report.status,
      llmProvider: report.llmProvider,
      llmModel: report.llmModel,
      prompt: report.prompt,
      content: report.content,
      errorMessage: report.errorMessage,
      fileIds: report.fileIds,
      config: report.config,
      tokenUsage: report.tokenUsage,
      createdAt: report.createdAt.toISOString(),
      startedAt: report.startedAt?.toISOString(),
      completedAt: report.completedAt?.toISOString(),
    };
  }

  // Export functionality (UC17)
  async exportReport(
    reportId: string,
    orgId: string,
    format: string = 'PDF',
    includeMetadata: boolean = true,
  ): Promise<ExportResult> {
    const report = reportsStore.get(reportId);
    if (!report || report.orgId !== orgId) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.COMPLETED) {
      throw new BadRequestException('Only completed reports can be exported');
    }

    const exportFormat = this.exportService.parseFormat(format);
    return this.exportService.export(report, { format: exportFormat, includeMetadata });
  }

  getExportFormats() {
    return this.exportService.getSupportedFormats();
  }
}
