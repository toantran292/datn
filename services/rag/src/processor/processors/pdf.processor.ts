import { Injectable, Logger } from '@nestjs/common';
import { DocumentProcessor, DocumentMetadata, ProcessedChunk } from './processor.interface';

// Dynamic import for pdf-parse to handle optional dependency
let PDFParseClass: any = null;

@Injectable()
export class PdfProcessor implements DocumentProcessor {
  private readonly logger = new Logger(PdfProcessor.name);
  private readonly supportedTypes = ['application/pdf'];
  private readonly chunkSize = 1000;
  private readonly chunkOverlap = 200;

  canProcess(mimeType: string): boolean {
    return this.supportedTypes.includes(mimeType);
  }

  getSupportedTypes(): string[] {
    return this.supportedTypes;
  }

  async process(content: Buffer | string, metadata: DocumentMetadata): Promise<ProcessedChunk[]> {
    // Lazy load pdf-parse v2
    if (!PDFParseClass) {
      try {
        const pdfModule = await import('pdf-parse');
        PDFParseClass = pdfModule.PDFParse;
      } catch {
        this.logger.warn('pdf-parse not installed. PDF processing disabled.');
        return [];
      }
    }

    const buffer = typeof content === 'string' ? Buffer.from(content, 'base64') : content;

    try {
      const pdfParser = new PDFParseClass();
      const result = await pdfParser.loadAndParse(buffer);
      const text = result.text?.value ?? '';

      if (!text || text.trim().length === 0) {
        return [];
      }

      // Clean the extracted text
      const cleanedText = this.cleanText(text);

      // Chunk the text
      const chunks = this.chunkText(cleanedText);

      return chunks.map((chunk, index) => ({
        content: chunk,
        chunkIndex: index,
        chunkTotal: chunks.length,
        metadata: {
          fileName: metadata.fileName,
          mimeType: metadata.mimeType,
          sourceId: metadata.sourceId,
          processorType: 'pdf',
          pageCount: result.info?.numPages ?? 0,
        },
      }));
    } catch (error) {
      this.logger.error('Error processing PDF:', error);
      return [];
    }
  }

  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace but preserve paragraph breaks
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      // Remove null characters
      .replace(/\0/g, '')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // Final trim
      .trim();
  }

  private chunkText(text: string): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];

    let currentIndex = 0;

    while (currentIndex < text.length) {
      let endIndex = Math.min(currentIndex + this.chunkSize, text.length);

      if (endIndex < text.length) {
        for (const sep of separators) {
          const lastSepIndex = text.lastIndexOf(sep, endIndex);
          if (lastSepIndex > currentIndex + this.chunkSize / 2) {
            endIndex = lastSepIndex + sep.length;
            break;
          }
        }
      }

      const chunk = text.slice(currentIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      currentIndex = endIndex - this.chunkOverlap;
      if (currentIndex >= text.length - this.chunkOverlap) {
        break;
      }
    }

    return chunks;
  }
}
