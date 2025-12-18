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

@Injectable()
export class LLMService implements OnModuleInit {
  private readonly logger = new Logger(LLMService.name);
  private defaultModel: ChatOpenAI;

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
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config?: LLMConfig,
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

  /**
   * Streaming chat completion
   */
  async *streamChat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config?: LLMConfig,
  ): AsyncGenerator<string> {
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
}
