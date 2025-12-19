import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IndexDocumentRequest {
  namespaceId: string;
  namespaceType?: string;
  orgId: string;
  sourceType: 'message' | 'attachment' | 'document' | 'file';
  sourceId: string;
  content: string;
  metadata?: Record<string, any>;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface IndexResponse {
  success: boolean;
  chunksCreated: number;
  message?: string;
}

export interface SearchRequest {
  query: string;
  namespaceId?: string;
  namespaceIds?: string[];
  namespaceType?: string;
  orgId?: string;
  sourceTypes?: Array<'message' | 'attachment' | 'document' | 'file'>;
  limit?: number;
  minSimilarity?: number;
}

export interface SearchResult {
  id: string;
  namespaceId: string;
  orgId: string;
  sourceType: string;
  sourceId: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, any>;
  similarity: number;
  createdAt: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export interface AskRequest extends SearchRequest {
  customPrompt?: string;
  llmConfig?: {
    modelName?: string;
    temperature?: number;
    maxTokens?: number;
  };
  stream?: boolean;
}

export interface AskResponse {
  answer: string;
  sources: Array<{
    type: string;
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
  confidence: number;
}

export interface DeleteResponse {
  success: boolean;
  deleted: number;
}

export interface StatsResponse {
  totalEmbeddings: number;
  bySourceType: Record<string, number>;
}

// LLM Types
export interface LLMConfig {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConversationMessage {
  userId: string;
  content: string;
  createdAt: Date | string;
}

export interface ActionItem {
  task: string;
  assignee: string | null;
  priority: 'high' | 'medium' | 'low';
  deadline: string | null;
}

export interface SummarizeResponse {
  summary: string;
}

export interface TranslateResponse {
  translation: string;
}

export interface ChatResponse {
  response: string;
}

export interface ExtractActionsResponse {
  items: ActionItem[];
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
   * Index a document for semantic search
   */
  async indexDocument(request: IndexDocumentRequest): Promise<IndexResponse> {
    if (!this.enabled) {
      return { success: false, chunksCreated: 0, message: 'RAG service disabled' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Failed to index document: ${error}`);
        return { success: false, chunksCreated: 0, message: error };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`RAG index error: ${error}`);
      return { success: false, chunksCreated: 0, message: String(error) };
    }
  }

  /**
   * Index a short text (like a message) without chunking
   */
  async indexShortText(request: IndexDocumentRequest): Promise<IndexResponse> {
    if (!this.enabled) {
      return { success: false, chunksCreated: 0, message: 'RAG service disabled' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings/index-short`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Failed to index short text: ${error}`);
        return { success: false, chunksCreated: 0, message: error };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`RAG index short error: ${error}`);
      return { success: false, chunksCreated: 0, message: String(error) };
    }
  }

  /**
   * Semantic search
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    if (!this.enabled) {
      return { results: [], total: 0, query: request.query };
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Search failed: ${error}`);
        return { results: [], total: 0, query: request.query };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`RAG search error: ${error}`);
      return { results: [], total: 0, query: request.query };
    }
  }

  /**
   * RAG question answering
   */
  async ask(request: AskRequest): Promise<AskResponse> {
    if (!this.enabled) {
      return { answer: 'RAG service is not available', sources: [], confidence: 0 };
    }

    try {
      const response = await fetch(`${this.baseUrl}/search/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, stream: false }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Ask failed: ${error}`);
        return { answer: `Error: ${error}`, sources: [], confidence: 0 };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`RAG ask error: ${error}`);
      return { answer: `Error: ${String(error)}`, sources: [], confidence: 0 };
    }
  }

  /**
   * RAG question answering with streaming
   */
  async *askStream(request: AskRequest): AsyncGenerator<string | { type: 'sources'; data: any[] }> {
    if (!this.enabled) {
      yield 'RAG service is not available';
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/search/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, stream: true }),
      });

      if (!response.ok) {
        const error = await response.text();
        yield `Error: ${error}`;
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield 'No response stream';
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: sources')) {
            // Next line should be data
            continue;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                yield data.text;
              } else if (Array.isArray(data)) {
                yield { type: 'sources', data };
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`RAG stream error: ${error}`);
      yield `Error: ${String(error)}`;
    }
  }

  /**
   * Delete embeddings by source
   */
  async deleteBySource(
    sourceType: 'message' | 'attachment' | 'document' | 'file',
    sourceId: string,
  ): Promise<DeleteResponse> {
    if (!this.enabled) {
      return { success: false, deleted: 0 };
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings/source/${sourceType}/${sourceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        return { success: false, deleted: 0 };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`RAG delete error: ${error}`);
      return { success: false, deleted: 0 };
    }
  }

  /**
   * Delete all embeddings for a namespace
   */
  async deleteByNamespace(namespaceId: string): Promise<DeleteResponse> {
    if (!this.enabled) {
      return { success: false, deleted: 0 };
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings/namespace/${namespaceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        return { success: false, deleted: 0 };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`RAG delete namespace error: ${error}`);
      return { success: false, deleted: 0 };
    }
  }

  /**
   * Get stats for a namespace
   */
  async getStats(namespaceId: string): Promise<StatsResponse> {
    if (!this.enabled) {
      return { totalEmbeddings: 0, bySourceType: {} };
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings/stats/${namespaceId}`);

      if (!response.ok) {
        return { totalEmbeddings: 0, bySourceType: {} };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`RAG stats error: ${error}`);
      return { totalEmbeddings: 0, bySourceType: {} };
    }
  }

  /**
   * Process and index a document (PDF, audio, video, text)
   */
  async processDocument(request: {
    namespaceId: string;
    namespaceType?: string;
    orgId: string;
    sourceId: string;
    fileName: string;
    mimeType: string;
    content: string; // base64 encoded
    metadata?: Record<string, any>;
  }): Promise<IndexResponse> {
    if (!this.enabled) {
      return { success: false, chunksCreated: 0, message: 'RAG service disabled' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Failed to process document: ${error}`);
        return { success: false, chunksCreated: 0, message: error };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`RAG process error: ${error}`);
      return { success: false, chunksCreated: 0, message: String(error) };
    }
  }

  // ==================== LLM Methods ====================

  /**
   * Generic LLM chat completion
   */
  async chat(
    messages: ChatMessage[],
    config?: LLMConfig,
  ): Promise<ChatResponse> {
    if (!this.enabled) {
      return { response: 'RAG service is not available' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, config, stream: false }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { response: `Error: ${error}` };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`LLM chat error: ${error}`);
      return { response: `Error: ${String(error)}` };
    }
  }

  /**
   * Streaming LLM chat completion
   */
  async *streamChat(messages: ChatMessage[], config?: LLMConfig): AsyncGenerator<string> {
    if (!this.enabled) {
      yield 'RAG service is not available';
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, config, stream: true }),
      });

      if (!response.ok) {
        yield `Error: ${await response.text()}`;
        return;
      }

      yield* this.readStream(response);
    } catch (error) {
      this.logger.error(`LLM stream chat error: ${error}`);
      yield `Error: ${String(error)}`;
    }
  }

  /**
   * Summarize conversation
   */
  async summarizeConversation(
    messages: ConversationMessage[],
    config?: LLMConfig,
    customPrompt?: string,
  ): Promise<SummarizeResponse> {
    if (!this.enabled) {
      return { summary: 'RAG service is not available' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/summarize/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, config, customPrompt, stream: false }),
      });

      if (!response.ok) {
        return { summary: `Error: ${await response.text()}` };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`LLM summarize conversation error: ${error}`);
      return { summary: `Error: ${String(error)}` };
    }
  }

  /**
   * Stream summarize conversation
   */
  async *streamSummarizeConversation(
    messages: ConversationMessage[],
    config?: LLMConfig,
    customPrompt?: string,
  ): AsyncGenerator<string> {
    if (!this.enabled) {
      yield 'RAG service is not available';
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/summarize/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, config, customPrompt, stream: true }),
      });

      if (!response.ok) {
        yield `Error: ${await response.text()}`;
        return;
      }

      yield* this.readStream(response);
    } catch (error) {
      this.logger.error(`LLM stream summarize error: ${error}`);
      yield `Error: ${String(error)}`;
    }
  }

  /**
   * Extract action items from conversation
   */
  async extractActionItems(
    messages: ConversationMessage[],
    config?: LLMConfig,
  ): Promise<ExtractActionsResponse> {
    if (!this.enabled) {
      return { items: [] };
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/extract/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, config, stream: false }),
      });

      if (!response.ok) {
        return { items: [] };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`LLM extract actions error: ${error}`);
      return { items: [] };
    }
  }

  /**
   * Stream extract action items (markdown format)
   */
  async *streamExtractActionItems(
    messages: ConversationMessage[],
    config?: LLMConfig,
  ): AsyncGenerator<string> {
    if (!this.enabled) {
      yield 'RAG service is not available';
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/extract/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, config, stream: true }),
      });

      if (!response.ok) {
        yield `Error: ${await response.text()}`;
        return;
      }

      yield* this.readStream(response);
    } catch (error) {
      this.logger.error(`LLM stream extract actions error: ${error}`);
      yield `Error: ${String(error)}`;
    }
  }

  /**
   * Summarize document
   */
  async summarizeDocument(
    content: string,
    documentName: string,
    config?: LLMConfig,
    customPrompt?: string,
  ): Promise<SummarizeResponse> {
    if (!this.enabled) {
      return { summary: 'RAG service is not available' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/summarize/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, documentName, config, customPrompt, stream: false }),
      });

      if (!response.ok) {
        return { summary: `Error: ${await response.text()}` };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`LLM summarize document error: ${error}`);
      return { summary: `Error: ${String(error)}` };
    }
  }

  /**
   * Stream summarize document
   */
  async *streamSummarizeDocument(
    content: string,
    documentName: string,
    config?: LLMConfig,
    customPrompt?: string,
  ): AsyncGenerator<string> {
    if (!this.enabled) {
      yield 'RAG service is not available';
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/summarize/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, documentName, config, customPrompt, stream: true }),
      });

      if (!response.ok) {
        yield `Error: ${await response.text()}`;
        return;
      }

      yield* this.readStream(response);
    } catch (error) {
      this.logger.error(`LLM stream summarize document error: ${error}`);
      yield `Error: ${String(error)}`;
    }
  }

  /**
   * Translate text
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
    config?: LLMConfig,
  ): Promise<TranslateResponse> {
    if (!this.enabled) {
      return { translation: 'RAG service is not available' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage, sourceLanguage, config, stream: false }),
      });

      if (!response.ok) {
        return { translation: `Error: ${await response.text()}` };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`LLM translate error: ${error}`);
      return { translation: `Error: ${String(error)}` };
    }
  }

  /**
   * Stream translate
   */
  async *streamTranslate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
    config?: LLMConfig,
  ): AsyncGenerator<string> {
    if (!this.enabled) {
      yield 'RAG service is not available';
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage, sourceLanguage, config, stream: true }),
      });

      if (!response.ok) {
        yield `Error: ${await response.text()}`;
        return;
      }

      yield* this.readStream(response);
    } catch (error) {
      this.logger.error(`LLM stream translate error: ${error}`);
      yield `Error: ${String(error)}`;
    }
  }

  /**
   * Summarize transcription (audio/video)
   */
  async summarizeTranscription(
    transcription: string,
    fileName: string,
    config?: LLMConfig,
  ): Promise<SummarizeResponse> {
    if (!this.enabled) {
      return { summary: 'RAG service is not available' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/summarize/transcription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription, fileName, config, stream: false }),
      });

      if (!response.ok) {
        return { summary: `Error: ${await response.text()}` };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`LLM summarize transcription error: ${error}`);
      return { summary: `Error: ${String(error)}` };
    }
  }

  /**
   * Stream summarize transcription
   */
  async *streamSummarizeTranscription(
    transcription: string,
    fileName: string,
    config?: LLMConfig,
  ): AsyncGenerator<string> {
    if (!this.enabled) {
      yield 'RAG service is not available';
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/llm/summarize/transcription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription, fileName, config, stream: true }),
      });

      if (!response.ok) {
        yield `Error: ${await response.text()}`;
        return;
      }

      yield* this.readStream(response);
    } catch (error) {
      this.logger.error(`LLM stream summarize transcription error: ${error}`);
      yield `Error: ${String(error)}`;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Helper to read SSE stream
   */
  private async *readStream(response: Response): AsyncGenerator<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      yield 'No response stream';
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              yield data.text;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}
