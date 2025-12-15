export interface DocumentMetadata {
  fileName: string;
  mimeType: string;
  size: number;
  sourceId: string;
  roomId: string;
  orgId: string;
  [key: string]: any;
}

export interface ProcessedChunk {
  content: string;
  chunkIndex: number;
  chunkTotal: number;
  metadata: Record<string, any>;
}

export interface DocumentProcessor {
  /**
   * Check if this processor can handle the given MIME type
   */
  canProcess(mimeType: string): boolean;

  /**
   * Process the document content and return chunks
   */
  process(content: Buffer | string, metadata: DocumentMetadata): Promise<ProcessedChunk[]>;

  /**
   * Get supported MIME types
   */
  getSupportedTypes(): string[];
}
