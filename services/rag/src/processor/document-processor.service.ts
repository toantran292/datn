import { Injectable, Logger } from '@nestjs/common';
import { DocumentProcessor, DocumentMetadata, ProcessedChunk } from './processors/processor.interface';
import { TextProcessor } from './processors/text.processor';
import { PdfProcessor } from './processors/pdf.processor';
import { AudioProcessor } from './processors/audio.processor';
import { VideoProcessor } from './processors/video.processor';

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private processors: DocumentProcessor[] = [];

  constructor(
    private readonly textProcessor: TextProcessor,
    private readonly pdfProcessor: PdfProcessor,
    private readonly audioProcessor: AudioProcessor,
    private readonly videoProcessor: VideoProcessor,
  ) {
    // Register processors in order of priority
    this.processors = [
      this.pdfProcessor,
      this.audioProcessor,
      this.videoProcessor,
      this.textProcessor, // Text processor as fallback for text-like types
    ];
  }

  /**
   * Get the appropriate processor for a MIME type
   */
  getProcessor(mimeType: string): DocumentProcessor | null {
    for (const processor of this.processors) {
      if (processor.canProcess(mimeType)) {
        return processor;
      }
    }
    return null;
  }

  /**
   * Check if a MIME type is supported
   */
  canProcess(mimeType: string): boolean {
    return this.getProcessor(mimeType) !== null;
  }

  /**
   * Process a document and return chunks
   */
  async process(
    content: Buffer | string,
    metadata: DocumentMetadata,
  ): Promise<ProcessedChunk[]> {
    const processor = this.getProcessor(metadata.mimeType);

    if (!processor) {
      this.logger.warn(`No processor found for MIME type: ${metadata.mimeType}`);
      return [];
    }

    this.logger.debug(`Processing ${metadata.fileName} with ${processor.constructor.name}`);
    return processor.process(content, metadata);
  }

  /**
   * Get all supported MIME types
   */
  getSupportedTypes(): string[] {
    const types = new Set<string>();
    for (const processor of this.processors) {
      for (const type of processor.getSupportedTypes()) {
        types.add(type);
      }
    }
    return Array.from(types);
  }

  /**
   * Process text content directly (for messages)
   */
  async processText(
    text: string,
    metadata: Omit<DocumentMetadata, 'mimeType'> & { mimeType?: string },
  ): Promise<ProcessedChunk[]> {
    return this.textProcessor.process(text, {
      fileName: metadata.fileName,
      size: metadata.size,
      sourceId: metadata.sourceId,
      namespaceId: metadata.namespaceId,
      orgId: metadata.orgId,
      mimeType: metadata.mimeType ?? 'text/plain',
    });
  }
}
