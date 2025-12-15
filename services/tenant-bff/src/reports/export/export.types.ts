export enum ExportFormat {
  PDF = 'PDF',
  DOCX = 'DOCX',
  MARKDOWN = 'MARKDOWN',
  HTML = 'HTML',
}

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeTokenUsage?: boolean;
}
