import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

export interface LLMConfig {
  modelProvider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
}

export interface ConversationMessage {
  userId: string;
  displayName?: string; // User display name for better AI responses
  content: string;
  createdAt: Date;
}

export interface ActionItem {
  task: string;
  assignee: string | null;
  priority: 'high' | 'medium' | 'low';
  deadline: string | null;
}

export interface QAResult {
  answer: string;
  sources: Array<{
    messageId: string;
    content: string;
    userId: string;
    createdAt: string;
  }>;
  confidence: number;
}

@Injectable()
export class LLMService implements OnModuleInit {
  private defaultModel: ChatOpenAI;
  private langsmithEnabled: boolean;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const langsmithApiKey = this.configService.get<string>('LANGSMITH_API_KEY');

    this.langsmithEnabled = !!langsmithApiKey;

    if (this.langsmithEnabled) {
      process.env.LANGCHAIN_TRACING_V2 = 'true';
      process.env.LANGCHAIN_API_KEY = langsmithApiKey;
      process.env.LANGCHAIN_PROJECT = this.configService.get<string>('LANGSMITH_PROJECT') || 'chat-ai';
    }

    this.defaultModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  private getModel(config?: Partial<LLMConfig>): ChatOpenAI {
    if (!config) return this.defaultModel;

    return new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: config.modelName || 'gpt-4o-mini',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000,
    });
  }

  /**
   * UC11: Summarize a conversation
   */
  async summarizeConversation(
    messages: ConversationMessage[],
    config?: Partial<LLMConfig>,
    customPrompt?: string,
  ): Promise<string> {
    const model = this.getModel(config);

    const formattedMessages = messages
      .map(m => `[${m.createdAt.toISOString()}] ${m.displayName || 'User'}: ${m.content}`)
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
- Sử dụng headings (##, ###) để phân chia sections
- Sử dụng > blockquote cho trích dẫn quan trọng

Ví dụ format:
## Tóm tắt
Cuộc hội thoại chủ yếu thảo luận về...

## Các quyết định chính
- **Quyết định 1**: Mô tả
- **Quyết định 2**: Mô tả

## Vấn đề chưa giải quyết
- Vấn đề 1
- Vấn đề 2`;

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Hãy tóm tắt cuộc hội thoại sau:\n\n${formattedMessages}`),
    ]);

    const parser = new StringOutputParser();
    return parser.invoke(response);
  }

  /**
   * UC12: Extract action items from conversation
   */
  async extractActionItems(
    messages: ConversationMessage[],
    config?: Partial<LLMConfig>,
    customPrompt?: string,
  ): Promise<ActionItem[]> {
    const model = this.getModel(config);

    const formattedMessages = messages
      .map(m => `[${m.createdAt.toISOString()}] ${m.displayName || 'User'}: ${m.content}`)
      .join('\n');

    const systemPrompt = customPrompt || `Bạn là trợ lý AI chuyên trích xuất các công việc cần làm (action items) từ hội thoại.

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

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Trích xuất các action items từ cuộc hội thoại sau:\n\n${formattedMessages}`),
    ]);

    try {
      const content = response.content as string;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
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
   * UC13: Answer questions based on conversation context (RAG-style)
   */
  async answerQuestion(
    question: string,
    contextMessages: Array<ConversationMessage & { id: string }>,
    config?: Partial<LLMConfig>,
    customPrompt?: string,
  ): Promise<QAResult> {
    const model = this.getModel(config);

    const formattedContext = contextMessages
      .map(m => `[MSG_ID: ${m.id}] [${m.createdAt.toISOString()}] ${m.displayName || 'User'}: ${m.content}`)
      .join('\n');

    const systemPrompt = customPrompt || `Bạn là trợ lý AI giúp trả lời câu hỏi dựa trên ngữ cảnh hội thoại.

Yêu cầu:
- Chỉ trả lời dựa trên thông tin có trong ngữ cảnh
- Nếu không tìm thấy câu trả lời, hãy nói rõ
- Đánh giá độ tin cậy của câu trả lời (0-1)
- Trả lời bằng tiếng Việt hoặc ngôn ngữ của câu hỏi

**TUYỆT ĐỐI KHÔNG ĐƯỢC** bao gồm trong phần "answer":
- MSG_ID, message ID, hoặc bất kỳ ID nào
- User ID, userId, hoặc mã định danh người dùng
- Timestamp, ngày giờ kỹ thuật
- Bất kỳ metadata kỹ thuật nào

Phần "answer" phải hoàn toàn tự nhiên, dễ đọc cho người dùng cuối. Chỉ sử dụng MSG_ID trong trường "sourceIds" để tham chiếu nội bộ.

Format câu trả lời bằng Markdown:
- Sử dụng **bold** cho thông tin quan trọng
- Sử dụng danh sách (-) khi liệt kê nhiều điểm
- Sử dụng \`code\` cho tên biến, hàm, technical terms
- Sử dụng > blockquote khi trích dẫn từ hội thoại
- Sử dụng ### heading cho các phần khác nhau nếu câu trả lời dài

QUAN TRỌNG: sourceIds KHÔNG được để rỗng. Phải chứa ít nhất 1 MSG_ID từ ngữ cảnh.

Trả về JSON với format:
{
  "answer": "Câu trả lời tự nhiên, không chứa ID hay metadata kỹ thuật",
  "sourceIds": ["msg_id_1", "msg_id_2"],
  "confidence": 0.8
}`;

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Ngữ cảnh hội thoại:\n${formattedContext}\n\nCâu hỏi: ${question}`),
    ]);

    try {
      const content = response.content as string;
      // Try to parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Map source IDs to actual message content
        let sources = (parsed.sourceIds || [])
          .map((id: string) => contextMessages.find(m => m.id === id))
          .filter(Boolean)
          .map((m: ConversationMessage & { id: string }) => ({
            messageId: m.id,
            content: m.content,
            userId: m.userId,
            createdAt: m.createdAt.toISOString(),
          }));

        // Fallback: if no sources found, pick most recent relevant messages
        if (sources.length === 0 && contextMessages.length > 0) {
          // Pick up to 3 most recent messages as fallback sources
          const recentMessages = [...contextMessages]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 3);

          sources = recentMessages.map(m => ({
            messageId: m.id,
            content: m.content,
            userId: m.userId,
            createdAt: m.createdAt.toISOString(),
          }));
        }

        return {
          answer: parsed.answer,
          sources,
          confidence: parsed.confidence ?? 0.5,
        };
      }
    } catch {
      // Fallback
    }

    // Fallback: if parsing failed, still provide some sources
    const fallbackSources = contextMessages.length > 0
      ? [...contextMessages]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 3)
          .map(m => ({
            messageId: m.id,
            content: m.content,
            userId: m.userId,
            createdAt: m.createdAt.toISOString(),
          }))
      : [];

    return {
      answer: response.content as string,
      sources: fallbackSources,
      confidence: 0.5,
    };
  }

  /**
   * UC14: Summarize a document
   */
  async summarizeDocument(
    documentContent: string,
    documentName: string,
    config?: Partial<LLMConfig>,
    customPrompt?: string,
  ): Promise<string> {
    const model = this.getModel(config);

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
- Sử dụng danh sách bullet points (-) cho các mục
- Sử dụng > blockquote cho trích dẫn từ tài liệu
- Sử dụng \`code\` cho technical terms

Ví dụ format:
## Tổng quan
Tài liệu này trình bày về...

## Nội dung chính
- **Điểm 1**: Mô tả
- **Điểm 2**: Mô tả

## Key Takeaways
1. Takeaway 1
2. Takeaway 2
3. Takeaway 3`;

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Hãy tóm tắt tài liệu "${documentName}":\n\n${documentContent}`),
    ]);

    const parser = new StringOutputParser();
    return parser.invoke(response);
  }

  /**
   * Generic chat completion for custom use cases
   */
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config?: Partial<LLMConfig>,
  ): Promise<string> {
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

  // ============== Streaming Methods ==============

  /**
   * UC11: Stream summarize conversation
   */
  async *streamSummarizeConversation(
    messages: ConversationMessage[],
    config?: Partial<LLMConfig>,
    customPrompt?: string,
  ): AsyncGenerator<string> {
    const model = this.getModel(config);

    const formattedMessages = messages
      .map(m => `[${m.createdAt.toISOString()}] ${m.displayName || 'User'}: ${m.content}`)
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
- Sử dụng headings (##, ###) để phân chia sections
- Sử dụng > blockquote cho trích dẫn quan trọng

Ví dụ format:
## Tóm tắt
Cuộc hội thoại chủ yếu thảo luận về...

## Các quyết định chính
- **Quyết định 1**: Mô tả
- **Quyết định 2**: Mô tả

## Vấn đề chưa giải quyết
- Vấn đề 1
- Vấn đề 2`;

    const stream = await model.stream([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Hãy tóm tắt cuộc hội thoại sau:\n\n${formattedMessages}`),
    ]);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  /**
   * UC13: Stream answer question (for plain text streaming, sources handled separately)
   */
  async *streamAnswerQuestion(
    question: string,
    contextMessages: Array<ConversationMessage & { id: string }>,
    config?: Partial<LLMConfig>,
    customPrompt?: string,
  ): AsyncGenerator<string> {
    const model = this.getModel(config);

    const formattedContext = contextMessages
      .map(m => `[${m.createdAt.toISOString()}] ${m.content}`)
      .join('\n');

    // Simplified prompt for streaming - no JSON required
    const systemPrompt = customPrompt || `Bạn là trợ lý AI giúp trả lời câu hỏi dựa trên ngữ cảnh hội thoại.

Yêu cầu:
- Chỉ trả lời dựa trên thông tin có trong ngữ cảnh
- Nếu không tìm thấy câu trả lời, hãy nói rõ
- Trả lời bằng tiếng Việt hoặc ngôn ngữ của câu hỏi

**TUYỆT ĐỐI KHÔNG ĐƯỢC** bao gồm trong câu trả lời:
- MSG_ID, message ID, hoặc bất kỳ ID nào
- User ID, userId, hoặc mã định danh người dùng
- Timestamp, ngày giờ kỹ thuật
- Bất kỳ metadata kỹ thuật nào

Câu trả lời phải hoàn toàn tự nhiên, dễ đọc cho người dùng cuối.

Format câu trả lời bằng Markdown:
- Sử dụng **bold** cho thông tin quan trọng
- Sử dụng danh sách (-) khi liệt kê nhiều điểm
- Sử dụng \`code\` cho tên biến, hàm, technical terms
- Sử dụng > blockquote khi trích dẫn từ hội thoại
- Sử dụng ### heading cho các phần khác nhau nếu câu trả lời dài`;

    const stream = await model.stream([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Ngữ cảnh hội thoại:\n${formattedContext}\n\nCâu hỏi: ${question}`),
    ]);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  /**
   * UC12: Stream extract action items
   */
  async *streamExtractActionItems(
    messages: ConversationMessage[],
    config?: Partial<LLMConfig>,
    customPrompt?: string,
  ): AsyncGenerator<string> {
    const model = this.getModel(config);

    const formattedMessages = messages
      .map(m => `[${m.createdAt.toISOString()}] ${m.displayName || 'User'}: ${m.content}`)
      .join('\n');

    const systemPrompt = customPrompt || `Bạn là trợ lý AI chuyên trích xuất các công việc cần làm (action items) từ hội thoại.

Yêu cầu:
- Xác định tất cả các nhiệm vụ, công việc được đề cập
- Ghi nhận người được giao việc (nếu có)
- Đánh giá mức độ ưu tiên dựa trên ngữ cảnh
- Ghi nhận deadline nếu được đề cập
- Chỉ trích xuất những action items rõ ràng, cụ thể

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

    const stream = await model.stream([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Trích xuất các action items từ cuộc hội thoại sau:\n\n${formattedMessages}`),
    ]);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  /**
   * UC14: Stream summarize document
   */
  async *streamSummarizeDocument(
    documentContent: string,
    documentName: string,
    config?: Partial<LLMConfig>,
    customPrompt?: string,
  ): AsyncGenerator<string> {
    const model = this.getModel(config);

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
- Sử dụng danh sách bullet points (-) cho các mục
- Sử dụng > blockquote cho trích dẫn từ tài liệu
- Sử dụng \`code\` cho technical terms

Ví dụ format:
## Tổng quan
Tài liệu này trình bày về...

## Nội dung chính
- **Điểm 1**: Mô tả
- **Điểm 2**: Mô tả

## Key Takeaways
1. Takeaway 1
2. Takeaway 2
3. Takeaway 3`;

    const stream = await model.stream([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Hãy tóm tắt tài liệu "${documentName}":\n\n${documentContent}`),
    ]);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  /**
   * Stream summarize audio transcription
   */
  async *streamSummarizeAudioTranscription(
    transcription: string,
    fileName: string,
    config?: Partial<LLMConfig>,
    customPrompt?: string,
  ): AsyncGenerator<string> {
    const model = this.getModel(config);

    const systemPrompt = customPrompt || `Bạn là trợ lý AI chuyên phân tích và tóm tắt nội dung audio/podcast.

Yêu cầu:
- Tóm tắt nội dung chính của bản ghi âm
- Nêu bật các điểm quan trọng được đề cập
- Trích xuất thông tin hữu ích từ cuộc hội thoại/bài nói
- Giữ độ dài tóm tắt phù hợp với độ dài nội dung
- Viết bằng ngôn ngữ chuyên nghiệp, dễ hiểu

Format output bằng Markdown:
- Sử dụng ## heading cho các phần chính
- Sử dụng **bold** cho điểm quan trọng
- Sử dụng danh sách bullet points (-) cho các mục
- Sử dụng > blockquote cho trích dẫn từ bản ghi
- Sử dụng \`code\` cho technical terms

Ví dụ format:
## Tổng quan
Bản ghi âm này nói về...

## Nội dung chính
- **Điểm 1**: Mô tả
- **Điểm 2**: Mô tả

## Key Takeaways
1. Takeaway 1
2. Takeaway 2
3. Takeaway 3`;

    const stream = await model.stream([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Hãy tóm tắt nội dung audio "${fileName}":\n\nBản chép lời (transcription):\n${transcription}`),
    ]);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  /**
   * Get relevant sources for a question (non-streaming, called before streaming)
   */
  async getRelevantSources(
    question: string,
    contextMessages: Array<ConversationMessage & { id: string }>,
    config?: Partial<LLMConfig>,
  ): Promise<Array<{ messageId: string; content: string; userId: string; createdAt: string }>> {
    const model = this.getModel(config);

    const formattedContext = contextMessages
      .map(m => `[MSG_ID: ${m.id}] ${m.content.substring(0, 200)}`)
      .join('\n');

    const response = await model.invoke([
      new SystemMessage(`Bạn là trợ lý AI. Nhiệm vụ của bạn là xác định 1-3 tin nhắn liên quan nhất đến câu hỏi.

CHỈ trả về JSON với format:
{"sourceIds": ["msg_id_1", "msg_id_2"]}

Không giải thích, không thêm text khác.`),
      new HumanMessage(`Các tin nhắn:\n${formattedContext}\n\nCâu hỏi: ${question}`),
    ]);

    try {
      const content = response.content as string;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const sources = (parsed.sourceIds || [])
          .map((id: string) => contextMessages.find(m => m.id === id))
          .filter(Boolean)
          .map((m: ConversationMessage & { id: string }) => ({
            messageId: m.id,
            content: m.content,
            userId: m.userId,
            createdAt: m.createdAt.toISOString(),
          }));

        if (sources.length > 0) return sources;
      }
    } catch {
      // Fallback
    }

    // Fallback: return 3 most recent messages
    return [...contextMessages]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3)
      .map(m => ({
        messageId: m.id,
        content: m.content,
        userId: m.userId,
        createdAt: m.createdAt.toISOString(),
      }));
  }
}
