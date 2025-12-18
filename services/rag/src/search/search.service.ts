import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../embedding/embedding.service';
import { SearchResult, SearchOptions } from '../embedding/embedding.repository';
import { LLMService, LLMConfig } from './llm.service';

export interface RAGQueryResult {
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

export interface AskOptions extends SearchOptions {
  llmConfig?: LLMConfig;
  customPrompt?: string;
  stream?: boolean;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly llmService: LLMService,
  ) {}

  /**
   * Semantic search for similar content
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    this.logger.debug(`Searching: "${query.substring(0, 50)}..." with options: ${JSON.stringify(options)}`);
    return this.embeddingService.search(query, options);
  }

  /**
   * RAG-enhanced question answering
   */
  async ask(
    question: string,
    options: AskOptions = {},
  ): Promise<RAGQueryResult> {
    const { llmConfig, customPrompt, ...searchOptions } = options;

    // 1. Semantic search for relevant context
    const searchResults = await this.search(question, {
      ...searchOptions,
      limit: searchOptions.limit ?? 10,
      minSimilarity: searchOptions.minSimilarity ?? 0.7,
    });

    if (searchResults.length === 0) {
      return {
        answer: 'Không tìm thấy thông tin liên quan trong cơ sở dữ liệu.',
        sources: [],
        confidence: 0,
      };
    }

    // 2. Build context from search results
    const context = this.buildContext(searchResults);

    // 3. Generate answer using LLM
    const answer = await this.generateAnswer(question, context, llmConfig, customPrompt);

    // 4. Calculate confidence based on search scores
    const avgScore = searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length;

    return {
      answer,
      sources: searchResults.map(r => ({
        type: r.sourceType,
        id: r.sourceId,
        content: r.content.substring(0, 200) + (r.content.length > 200 ? '...' : ''),
        score: r.similarity,
        metadata: r.metadata,
      })),
      confidence: avgScore,
    };
  }

  /**
   * Streaming RAG question answering
   */
  async *askStream(
    question: string,
    options: AskOptions = {},
  ): AsyncGenerator<string | { type: 'sources'; data: any[] }> {
    const { llmConfig, customPrompt, ...searchOptions } = options;

    // 1. Semantic search
    const searchResults = await this.search(question, {
      ...searchOptions,
      limit: searchOptions.limit ?? 10,
      minSimilarity: searchOptions.minSimilarity ?? 0.7,
    });

    // 2. Yield sources first
    yield {
      type: 'sources',
      data: searchResults.map(r => ({
        type: r.sourceType,
        id: r.sourceId,
        content: r.content.substring(0, 200) + (r.content.length > 200 ? '...' : ''),
        score: r.similarity,
        metadata: r.metadata,
      })),
    };

    if (searchResults.length === 0) {
      yield 'Không tìm thấy thông tin liên quan trong cơ sở dữ liệu.';
      return;
    }

    // 3. Build context and stream answer
    const context = this.buildContext(searchResults);

    const systemPrompt = customPrompt || this.getDefaultSystemPrompt();
    const userPrompt = `Ngữ cảnh:\n${context}\n\nCâu hỏi: ${question}`;

    for await (const chunk of this.llmService.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      llmConfig,
    )) {
      yield chunk;
    }
  }

  /**
   * Build context string from search results
   */
  private buildContext(searchResults: SearchResult[]): string {
    const contextParts: string[] = [];

    for (const result of searchResults) {
      const source = result.sourceType === 'message' ? 'Tin nhắn' : 'Tài liệu';
      contextParts.push(`[${source}] (relevance: ${(result.similarity * 100).toFixed(1)}%)`);
      contextParts.push(result.content);
      contextParts.push('');
    }

    return contextParts.join('\n');
  }

  /**
   * Generate answer using LLM with context
   */
  private async generateAnswer(
    question: string,
    context: string,
    config?: LLMConfig,
    customPrompt?: string,
  ): Promise<string> {
    const systemPrompt = customPrompt || this.getDefaultSystemPrompt();

    const userPrompt = `Ngữ cảnh:\n${context}\n\nCâu hỏi: ${question}`;

    return this.llmService.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      config,
    );
  }

  private getDefaultSystemPrompt(): string {
    return `Bạn là trợ lý AI giúp trả lời câu hỏi dựa trên ngữ cảnh tài liệu và hội thoại.

Quy tắc:
- Chỉ trả lời dựa trên thông tin có trong ngữ cảnh được cung cấp
- Nếu không tìm thấy thông tin liên quan, hãy nói rõ
- Trả lời ngắn gọn, súc tích và chính xác
- Nếu có nhiều nguồn thông tin, hãy tổng hợp chúng
- Trả lời bằng tiếng Việt hoặc ngôn ngữ của câu hỏi

Format câu trả lời bằng Markdown:
- Sử dụng **bold** cho điểm quan trọng
- Sử dụng danh sách (-) khi liệt kê nhiều điểm
- Sử dụng > blockquote khi trích dẫn từ ngữ cảnh`;
  }
}
