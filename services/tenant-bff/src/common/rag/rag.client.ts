import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LLMConfig {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
}

export interface LlmResult {
  content: string;
  usage: Record<string, any>;
  success: boolean;
  error?: string;
}

export interface SearchOptions {
  namespaceId?: string;
  namespaceIds?: string[];
  namespaceType?: string;
  orgId?: string;
  sourceTypes?: string[];
  limit?: number;
  minSimilarity?: number;
}

export interface SearchResultItem {
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
  results: SearchResultItem[];
  total: number;
  query: string;
}

export interface AskOptions extends SearchOptions {
  customPrompt?: string;
  llmConfig?: LLMConfig;
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
   * Generic LLM chat completion - replacement for LlmService.generate
   */
  async generate(
    prompt: string,
    context: string,
    _provider: string = 'OPENAI',
    model?: string,
  ): Promise<LlmResult> {
    if (!this.enabled) {
      return {
        content: '',
        usage: {},
        success: false,
        error: 'RAG service is not available',
      };
    }

    try {
      const fullPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt;

      const response = await fetch(`${this.baseUrl}/llm/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates professional reports.',
            },
            { role: 'user', content: fullPrompt },
          ],
          config: {
            modelName: model || 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 4000,
          },
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          content: '',
          usage: {},
          success: false,
          error: `RAG API error: ${error}`,
        };
      }

      const data = await response.json();

      return {
        content: data.response || '',
        usage: {
          model: model || 'gpt-4o-mini',
          provider: 'RAG_SERVICE',
        },
        success: true,
      };
    } catch (error) {
      this.logger.error(`RAG generate error: ${error}`);
      return {
        content: '',
        usage: {},
        success: false,
        error: String(error),
      };
    }
  }

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

  getDefaultModel(_provider: string): string {
    return 'gpt-4o-mini';
  }

  /**
   * Semantic search for content in RAG database
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    if (!this.enabled) {
      return { results: [], total: 0, query };
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          ...options,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`RAG search error: ${error}`);
        return { results: [], total: 0, query };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`RAG search error: ${error}`);
      return { results: [], total: 0, query };
    }
  }

  /**
   * RAG-enhanced question answering
   */
  async ask(query: string, options: AskOptions = {}): Promise<AskResponse> {
    if (!this.enabled) {
      return {
        answer: 'RAG service is not available',
        sources: [],
        confidence: 0,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/search/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          ...options,
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`RAG ask error: ${error}`);
        return {
          answer: `Error: ${error}`,
          sources: [],
          confidence: 0,
        };
      }

      return response.json();
    } catch (error) {
      this.logger.error(`RAG ask error: ${error}`);
      return {
        answer: `Error: ${String(error)}`,
        sources: [],
        confidence: 0,
      };
    }
  }

  /**
   * Streaming LLM chat completion
   */
  async *chatStream(
    messages: ChatMessage[],
    config?: LLMConfig,
  ): AsyncGenerator<string, void, unknown> {
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
        const error = await response.text();
        yield `Error: ${error}`;
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield 'Error: No response body';
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
            const data = line.slice(6);
            if (data === '{}') continue; // done event
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                yield parsed.text;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`LLM chat stream error: ${error}`);
      yield `Error: ${String(error)}`;
    }
  }
}
