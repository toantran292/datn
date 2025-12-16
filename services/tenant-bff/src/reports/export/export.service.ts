import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Report } from '../entities/report.entity';
import { ExportFormat, ExportResult, ExportOptions } from './export.types';
import { MarkdownExporter } from './markdown-exporter';
import { HtmlExporter } from './html-exporter';
import { PdfExporter } from './pdf-exporter';
import { DocxExporter } from './docx-exporter';

@Injectable()
export class ExportService {
  private markdownExporter: MarkdownExporter;
  private htmlExporter: HtmlExporter;
  private pdfExporter: PdfExporter;
  private docxExporter: DocxExporter;

  constructor() {
    this.markdownExporter = new MarkdownExporter();
    this.htmlExporter = new HtmlExporter();
    this.pdfExporter = new PdfExporter();
    this.docxExporter = new DocxExporter();
  }

  /**
   * Export a report to the specified format
   */
  async export(report: Report, options: ExportOptions = {}): Promise<ExportResult> {
    const { format = ExportFormat.PDF, includeMetadata = true } = options;

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    switch (format) {
      case ExportFormat.PDF:
        return this.pdfExporter.export(report, includeMetadata);

      case ExportFormat.DOCX:
        return this.docxExporter.export(report, includeMetadata);

      case ExportFormat.MARKDOWN:
        return this.markdownExporter.export(report, includeMetadata);

      case ExportFormat.HTML:
        return this.htmlExporter.export(report, includeMetadata);

      default:
        throw new BadRequestException(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): { format: ExportFormat; mimeType: string; extension: string }[] {
    return [
      {
        format: ExportFormat.PDF,
        mimeType: 'text/html', // Currently HTML with print styles, will be application/pdf with puppeteer
        extension: '.html',
      },
      {
        format: ExportFormat.DOCX,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: '.docx',
      },
      {
        format: ExportFormat.MARKDOWN,
        mimeType: 'text/markdown',
        extension: '.md',
      },
      {
        format: ExportFormat.HTML,
        mimeType: 'text/html',
        extension: '.html',
      },
    ];
  }

  /**
   * Validate export format
   */
  isValidFormat(format: string): boolean {
    return Object.values(ExportFormat).includes(format as ExportFormat);
  }

  /**
   * Parse format string to ExportFormat enum
   */
  parseFormat(format: string): ExportFormat {
    const upperFormat = format.toUpperCase();
    if (!this.isValidFormat(upperFormat)) {
      throw new BadRequestException(
        `Invalid export format: ${format}. Supported formats: ${Object.values(ExportFormat).join(', ')}`
      );
    }
    return upperFormat as ExportFormat;
  }
}
