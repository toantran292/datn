import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

interface ChatCompletionResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({
      apiKey,
    });

    this.model = this.configService.get<string>('AI_MODEL', 'gpt-4o-mini');
    this.maxTokens = this.configService.get<number>('AI_MAX_TOKENS', 2000);
    this.temperature = this.configService.get<number>('AI_TEMPERATURE', 0.7);

    this.logger.log(`OpenAI service initialized with model: ${this.model}`);
  }

  /**
   * Create chat completion
   */
  async createChatCompletion(
    request: Partial<ChatCompletionRequest>,
  ): Promise<ChatCompletionResponse> {
    const startTime = Date.now();

    try {
      const completion = await this.openai.chat.completions.create({
        model: request.model || this.model,
        messages: request.messages || [],
        temperature: request.temperature ?? this.temperature,
        max_tokens: request.max_tokens ?? this.maxTokens,
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `OpenAI completion successful - Tokens: ${tokensUsed}, Time: ${processingTime}ms`,
      );

      return {
        content,
        tokensUsed,
        model: completion.model,
      };
    } catch (error) {
      this.logger.error('OpenAI API error', error.stack);

      // Handle specific OpenAI errors
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.message;

        if (status === 429) {
          throw new InternalServerErrorException(
            'OpenAI API rate limit exceeded. Please try again later.',
          );
        }

        if (status === 401) {
          throw new InternalServerErrorException('OpenAI API authentication failed');
        }

        if (status === 500) {
          throw new InternalServerErrorException('OpenAI API service error');
        }

        throw new InternalServerErrorException(`OpenAI API error: ${message}`);
      }

      throw new InternalServerErrorException(
        'Failed to communicate with AI service. Please try again.',
      );
    }
  }

  /**
   * Create streaming chat completion
   * Returns async generator for Server-Sent Events
   */
  async *createStreamingChatCompletion(
    request: Partial<ChatCompletionRequest>,
  ): AsyncGenerator<string> {
    const startTime = Date.now();

    try {
      this.logger.log('Starting OpenAI streaming completion...');

      const stream = await this.openai.chat.completions.create({
        model: request.model || this.model,
        messages: request.messages || [],
        temperature: request.temperature ?? this.temperature,
        max_tokens: request.max_tokens ?? this.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`OpenAI streaming completed in ${processingTime}ms`);
    } catch (error) {
      this.logger.error('OpenAI streaming error', error.stack);

      // Handle specific OpenAI errors
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.message;

        if (status === 429) {
          throw new InternalServerErrorException(
            'OpenAI API rate limit exceeded. Please try again later.',
          );
        }

        if (status === 401) {
          throw new InternalServerErrorException('OpenAI API authentication failed');
        }

        if (status === 500) {
          throw new InternalServerErrorException('OpenAI API service error');
        }

        throw new InternalServerErrorException(`OpenAI API error: ${message}`);
      }

      throw new InternalServerErrorException(
        'Failed to communicate with AI service. Please try again.',
      );
    }
  }

  /**
   * Estimate tokens for a text
   * Rough estimation: 1 token ≈ 4 characters
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if request would exceed token limit
   */
  wouldExceedTokenLimit(promptTokens: number, maxTokens: number = this.maxTokens): boolean {
    // Reserve some tokens for response
    const totalEstimate = promptTokens + maxTokens;
    const modelLimit = 128000; // gpt-4o-mini context window

    return totalEstimate > modelLimit;
  }
}
