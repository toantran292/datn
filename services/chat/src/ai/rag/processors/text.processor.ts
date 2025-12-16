import { Injectable } from '@nestjs/common';
import { DocumentProcessor, DocumentMetadata, ProcessedChunk } from './processor.interface';

@Injectable()
export class TextProcessor implements DocumentProcessor {
  private readonly supportedTypes = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'text/html',
    'application/json',
    'application/xml',
    'text/xml',
  ];

  private readonly chunkSize = 1000;
  private readonly chunkOverlap = 200;

  canProcess(mimeType: string): boolean {
    return this.supportedTypes.some(type =>
      mimeType.startsWith(type) || mimeType.includes('text/'),
    );
  }

  getSupportedTypes(): string[] {
    return this.supportedTypes;
  }

  async process(content: Buffer | string, metadata: DocumentMetadata): Promise<ProcessedChunk[]> {
    const text = typeof content === 'string' ? content : content.toString('utf-8');

    // Clean and normalize text
    const cleanedText = this.cleanText(text);

    if (!cleanedText || cleanedText.length === 0) {
      return [];
    }

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
        processorType: 'text',
      },
    }));
  }

  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove null characters
      .replace(/\0/g, '')
      // Trim
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
        // Find natural break point
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
