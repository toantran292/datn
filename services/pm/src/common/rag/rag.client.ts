import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IndexShortTextRequest {
  namespaceId: string;
  namespaceType: string;
  orgId: string;
  sourceType: 'message' | 'attachment' | 'document' | 'file';
  sourceId: string;
  content: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class RagClient implements OnModuleInit {
  private readonly logger = new Logger(RagClient.name);
  private baseUrl: string;
  private enabled: boolean = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.baseUrl = this.configService.get<string>('RAG_SERVICE_URL', 'http://rag-api:3000');
    this.enabled = this.configService.get<boolean>('RAG_ENABLED', true);

    if (this.enabled) {
      this.logger.log(`RAG client initialized with URL: ${this.baseUrl}`);
    } else {
      this.logger.warn('RAG client is disabled');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Index a short text (like an issue) without chunking
   */
  async indexShortText(request: IndexShortTextRequest): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings/index-short`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`RAG index error: ${error}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`RAG index error: ${error}`);
      return false;
    }
  }

  /**
   * Delete embeddings by source
   */
  async deleteBySource(sourceType: string, sourceId: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/embeddings/source/${sourceType}/${sourceId}`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`RAG delete error: ${error}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`RAG delete error: ${error}`);
      return false;
    }
  }
}
