import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';

export interface LLMConfig {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ActionItem {
  task: string;
  assignee: string | null;
  priority: 'high' | 'medium' | 'low';
  deadline: string | null;
}

export interface ConversationMessage {
  userId: string;
  content: string;
  createdAt: Date;
}

@Injectable()
export class LLMService implements OnModuleInit {
  private readonly logger = new Logger(LLMService.name);
  private defaultModel: ChatOpenAI;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured. LLM service will not work.');
      return;
    }

    this.defaultModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
    });

    this.initialized = true;
    this.logger.log('LLM service initialized');
  }

  private getModel(config?: LLMConfig): ChatOpenAI {
    if (!config && this.defaultModel) return this.defaultModel;

    return new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: config?.modelName || 'gpt-4o-mini',
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 2000,
    });
  }

  /**
   * Generic chat completion
   */
  async chat(messages: ChatMessage[], config?: LLMConfig): Promise<string> {
    if (!this.initialized) {
      throw new Error('LLM service not initialized');
    }

    const model = this.getModel(config);

    const langchainMessages = messages.map(m => {
      switch (m.role) {
        case 'system':
          return new SystemMessage(m.content);
        case 'assistant':
          return new AIMessage(m.content);
        default:
          return new HumanMessage(m.content);
      }
    });

    const response = await model.invoke(langchainMessages);
    const parser = new StringOutputParser();
    return parser.invoke(response);
  }

  /**
   * Streaming chat completion
   */
  async *streamChat(messages: ChatMessage[], config?: LLMConfig): AsyncGenerator<string> {
    if (!this.initialized) {
      yield 'LLM service not initialized';
      return;
    }

    const model = this.getModel(config);

    const langchainMessages = messages.map(m => {
      switch (m.role) {
        case 'system':
          return new SystemMessage(m.content);
        case 'assistant':
          return new AIMessage(m.content);
        default:
          return new HumanMessage(m.content);
      }
    });

    const stream = await model.stream(langchainMessages);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  /**
   * Summarize conversation
   */
  async summarizeConversation(
    messages: ConversationMessage[],
    config?: LLMConfig,
    customPrompt?: string,
  ): Promise<string> {
    const formattedMessages = messages
      .map(m => `[${m.createdAt.toISOString()}] User ${m.userId}: ${m.content}`)
      .join('\n');

    const systemPrompt = customPrompt || `Bạn là trợ lý AI chuyên tóm tắt hội thoại. Hãy tóm tắt cuộc hội thoại sau một cách ngắn gọn, súc tích nhưng đầy đủ các điểm chính.

Yêu cầu:
- Tóm tắt các chủ đề chính được thảo luận
- Nêu bật các quyết định quan trọng (nếu có)
- Ghi nhận các câu hỏi chưa được giải quyết (nếu có)
- Viết bằng ngôn ngữ chuyên nghiệp, dễ hiểu

Format output bằng Markdown:
- Sử dụng **bold** cho điểm quan trọng
- Sử dụng danh sách bullet points (-) cho các mục
- Sử dụng headings (##, ###) để phân chia sections`;

    return this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Hãy tóm tắt cuộc hội thoại sau:\n\n${formattedMessages}` },
      ],
      config,
    );
  }

  /**
   * Stream summarize conversation
   */
  async *streamSummarizeConversation(
    messages: ConversationMessage[],
    config?: LLMConfig,
    customPrompt?: string,
  ): AsyncGenerator<string> {
    const formattedMessages = messages
      .map(m => `[${m.createdAt.toISOString()}] User ${m.userId}: ${m.content}`)
      .join('\n');

    const systemPrompt = customPrompt || `Bạn là trợ lý AI chuyên tóm tắt hội thoại. Hãy tóm tắt cuộc hội thoại sau một cách ngắn gọn, súc tích nhưng đầy đủ các điểm chính.

Yêu cầu:
- Tóm tắt các chủ đề chính được thảo luận
- Nêu bật các quyết định quan trọng (nếu có)
- Ghi nhận các câu hỏi chưa được giải quyết (nếu có)
- Viết bằng ngôn ngữ chuyên nghiệp, dễ hiểu

Format output bằng Markdown:
- Sử dụng **bold** cho điểm quan trọng
- Sử dụng danh sách bullet points (-) cho các mục
- Sử dụng headings (##, ###) để phân chia sections`;

    yield* this.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Hãy tóm tắt cuộc hội thoại sau:\n\n${formattedMessages}` },
      ],
      config,
    );
  }

  /**
   * Extract action items from conversation
   */
  async extractActionItems(
    messages: ConversationMessage[],
    config?: LLMConfig,
  ): Promise<ActionItem[]> {
    const formattedMessages = messages
      .map(m => `[${m.createdAt.toISOString()}] User ${m.userId}: ${m.content}`)
      .join('\n');

    const systemPrompt = `Bạn là trợ lý AI chuyên trích xuất các công việc cần làm (action items) từ hội thoại.

Yêu cầu:
- Xác định tất cả các nhiệm vụ, công việc được đề cập
- Ghi nhận người được giao việc (nếu có)
- Đánh giá mức độ ưu tiên dựa trên ngữ cảnh
- Ghi nhận deadline nếu được đề cập
- Chỉ trích xuất những action items rõ ràng, cụ thể

Trả về JSON với format:
{
  "items": [
    {
      "task": "Mô tả công việc",
      "assignee": "userId hoặc null",
      "priority": "high|medium|low",
      "deadline": "YYYY-MM-DD hoặc null"
    }
  ]
}`;

    const response = await this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Trích xuất các action items từ cuộc hội thoại sau:\n\n${formattedMessages}` },
      ],
      config,
    );

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return (parsed.items || []).map((item: any) => ({
          task: item.task || '',
          assignee: item.assignee || null,
          priority: item.priority || 'medium',
          deadline: item.deadline || null,
        }));
      }
    } catch {
      // Fallback if parsing fails
    }
    return [];
  }

  /**
   * Stream extract action items (markdown format)
   */
  async *streamExtractActionItems(
    messages: ConversationMessage[],
    config?: LLMConfig,
  ): AsyncGenerator<string> {
    const formattedMessages = messages
      .map(m => `[${m.createdAt.toISOString()}] User ${m.userId}: ${m.content}`)
      .join('\n');

    const systemPrompt = `Bạn là trợ lý AI chuyên trích xuất các công việc cần làm (action items) từ hội thoại.

**QUAN TRỌNG**: Format output như sau:
- Bắt đầu bằng một dòng tổng kết ngắn
- Liệt kê từng action item theo format markdown:

## Action Items

1. **[Mức độ ưu tiên]** Mô tả công việc
   - Người thực hiện: [tên hoặc "Chưa xác định"]
   - Deadline: [ngày hoặc "Chưa xác định"]

2. **[Mức độ ưu tiên]** Mô tả công việc tiếp theo
   ...

Nếu không tìm thấy action item nào, trả về: "Không tìm thấy công việc cần làm trong cuộc hội thoại này."`;

    yield* this.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Trích xuất các action items từ cuộc hội thoại sau:\n\n${formattedMessages}` },
      ],
      config,
    );
  }

  /**
   * Summarize document
   */
  async summarizeDocument(
    content: string,
    documentName: string,
    config?: LLMConfig,
    customPrompt?: string,
  ): Promise<string> {
    const systemPrompt = customPrompt || `Bạn là trợ lý AI chuyên tóm tắt tài liệu.

Yêu cầu:
- Tóm tắt nội dung chính của tài liệu
- Nêu bật các điểm quan trọng
- Liệt kê các key takeaways
- Giữ độ dài tóm tắt phù hợp với độ dài tài liệu
- Viết bằng ngôn ngữ chuyên nghiệp, dễ hiểu

Format output bằng Markdown:
- Sử dụng ## heading cho các phần chính
- Sử dụng **bold** cho điểm quan trọng
- Sử dụng danh sách bullet points (-) cho các mục`;

    return this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Hãy tóm tắt tài liệu "${documentName}":\n\n${content}` },
      ],
      config,
    );
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
    const systemPrompt = customPrompt || `Bạn là trợ lý AI chuyên tóm tắt tài liệu.

Yêu cầu:
- Tóm tắt nội dung chính của tài liệu
- Nêu bật các điểm quan trọng
- Liệt kê các key takeaways
- Giữ độ dài tóm tắt phù hợp với độ dài tài liệu
- Viết bằng ngôn ngữ chuyên nghiệp, dễ hiểu

Format output bằng Markdown:
- Sử dụng ## heading cho các phần chính
- Sử dụng **bold** cho điểm quan trọng
- Sử dụng danh sách bullet points (-) cho các mục`;

    yield* this.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Hãy tóm tắt tài liệu "${documentName}":\n\n${content}` },
      ],
      config,
    );
  }

  /**
   * Translate text
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
    config?: LLMConfig,
  ): Promise<string> {
    const fromLang = sourceLanguage ? `từ ${sourceLanguage} ` : '';
    const systemPrompt = `Bạn là trợ lý dịch thuật chuyên nghiệp. Dịch văn bản ${fromLang}sang ${targetLanguage}.

Yêu cầu:
- Giữ nguyên ý nghĩa và ngữ cảnh
- Dịch tự nhiên, không máy móc
- Giữ nguyên format (nếu có markdown, code blocks, etc.)
- Không thêm giải thích, chỉ trả về bản dịch`;

    return this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      config,
    );
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
    const fromLang = sourceLanguage ? `từ ${sourceLanguage} ` : '';
    const systemPrompt = `Bạn là trợ lý dịch thuật chuyên nghiệp. Dịch văn bản ${fromLang}sang ${targetLanguage}.

Yêu cầu:
- Giữ nguyên ý nghĩa và ngữ cảnh
- Dịch tự nhiên, không máy móc
- Giữ nguyên format (nếu có markdown, code blocks, etc.)
- Không thêm giải thích, chỉ trả về bản dịch`;

    yield* this.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      config,
    );
  }

  /**
   * Summarize audio/video transcription
   */
  async summarizeTranscription(
    transcription: string,
    fileName: string,
    config?: LLMConfig,
  ): Promise<string> {
    const systemPrompt = `Bạn là trợ lý AI chuyên phân tích và tóm tắt nội dung audio/video.

Yêu cầu:
- Tóm tắt nội dung chính của bản ghi
- Nêu bật các điểm quan trọng được đề cập
- Trích xuất thông tin hữu ích
- Viết bằng ngôn ngữ chuyên nghiệp, dễ hiểu

Format output bằng Markdown:
- Sử dụng ## heading cho các phần chính
- Sử dụng **bold** cho điểm quan trọng
- Sử dụng danh sách bullet points (-) cho các mục`;

    return this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Hãy tóm tắt nội dung audio/video "${fileName}":\n\nBản chép lời:\n${transcription}` },
      ],
      config,
    );
  }

  /**
   * Stream summarize transcription
   */
  async *streamSummarizeTranscription(
    transcription: string,
    fileName: string,
    config?: LLMConfig,
  ): AsyncGenerator<string> {
    const systemPrompt = `Bạn là trợ lý AI chuyên phân tích và tóm tắt nội dung audio/video.

Yêu cầu:
- Tóm tắt nội dung chính của bản ghi
- Nêu bật các điểm quan trọng được đề cập
- Trích xuất thông tin hữu ích
- Viết bằng ngôn ngữ chuyên nghiệp, dễ hiểu

Format output bằng Markdown:
- Sử dụng ## heading cho các phần chính
- Sử dụng **bold** cho điểm quan trọng
- Sử dụng danh sách bullet points (-) cho các mục`;

    yield* this.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Hãy tóm tắt nội dung audio/video "${fileName}":\n\nBản chép lời:\n${transcription}` },
      ],
      config,
    );
  }
}
