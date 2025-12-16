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
      .map(m => `[${m.createdAt.toISOString()}] User ${m.userId}: ${m.content}`)
      .join('\n');

    const systemPrompt = customPrompt || `Bạn là trợ lý AI chuyên tóm tắt hội thoại. Hãy tóm tắt cuộc hội thoại sau một cách ngắn gọn, súc tích nhưng đầy đủ các điểm chính.

Yêu cầu:
- Tóm tắt các chủ đề chính được thảo luận
- Nêu bật các quyết định quan trọng (nếu có)
- Ghi nhận các câu hỏi chưa được giải quyết (nếu có)
- Viết bằng ngôn ngữ chuyên nghiệp, dễ hiểu
- Độ dài tóm tắt từ 3-5 đoạn ngắn`;

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
      .map(m => `[${m.createdAt.toISOString()}] User ${m.userId}: ${m.content}`)
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
      .map(m => `[MSG_ID: ${m.id}] [${m.createdAt.toISOString()}] User ${m.userId}: ${m.content}`)
      .join('\n');

    const systemPrompt = customPrompt || `Bạn là trợ lý AI giúp trả lời câu hỏi dựa trên ngữ cảnh hội thoại.

Yêu cầu:
- Chỉ trả lời dựa trên thông tin có trong ngữ cảnh
- Nếu không tìm thấy câu trả lời, hãy nói rõ
- Trích dẫn nguồn bằng MSG_ID khi có thể
- Đánh giá độ tin cậy của câu trả lời (0-1)
- Trả lời bằng tiếng Việt hoặc ngôn ngữ của câu hỏi

Trả về JSON với format:
{
  "answer": "Câu trả lời của bạn",
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
        const sources = (parsed.sourceIds || [])
          .map((id: string) => contextMessages.find(m => m.id === id))
          .filter(Boolean)
          .map((m: ConversationMessage & { id: string }) => ({
            messageId: m.id,
            content: m.content,
            userId: m.userId,
            createdAt: m.createdAt.toISOString(),
          }));

        return {
          answer: parsed.answer,
          sources,
          confidence: parsed.confidence ?? 0.5,
        };
      }
    } catch {
      // Fallback
    }

    return {
      answer: response.content as string,
      sources: [],
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
- Viết bằng ngôn ngữ chuyên nghiệp, dễ hiểu`;

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
}
