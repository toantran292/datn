import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider } from '../reports/entities/report.entity';

export interface LlmResult {
  content: string;
  usage: Record<string, any>;
  success: boolean;
  error?: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly config: ConfigService) {}

  async generate(
    prompt: string,
    context: string,
    provider: LlmProvider = LlmProvider.OPENAI,
    model?: string,
  ): Promise<LlmResult> {
    this.logger.log(`Generating with ${provider}, model: ${model || 'default'}`);

    try {
      switch (provider) {
        case LlmProvider.OPENAI:
          return this.generateWithOpenAI(prompt, context, model);
        case LlmProvider.ANTHROPIC:
          return this.generateWithAnthropic(prompt, context, model);
        case LlmProvider.GOOGLE:
          return this.generateWithGoogle(prompt, context, model);
        default:
          return this.generateMock(prompt, context);
      }
    } catch (error) {
      this.logger.error(`LLM generation failed: ${error.message}`);
      return {
        content: '',
        usage: {},
        success: false,
        error: error.message,
      };
    }
  }

  private async generateWithOpenAI(
    prompt: string,
    context: string,
    model?: string,
  ): Promise<LlmResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured, using mock');
      return this.generateMock(prompt, context);
    }

    const effectiveModel = model || 'gpt-4';
    const fullPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt;

    // TODO: Integrate with LangSmith for tracing
    // For now, direct OpenAI call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates professional reports.',
          },
          { role: 'user', content: fullPrompt },
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return {
      content,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens,
        completion_tokens: data.usage?.completion_tokens,
        total_tokens: data.usage?.total_tokens,
        model: effectiveModel,
        provider: 'OPENAI',
      },
      success: true,
    };
  }

  private async generateWithAnthropic(
    prompt: string,
    context: string,
    model?: string,
  ): Promise<LlmResult> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('Anthropic API key not configured, using mock');
      return this.generateMock(prompt, context);
    }

    const effectiveModel = model || 'claude-3-sonnet-20240229';
    const fullPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: effectiveModel,
        max_tokens: 4000,
        messages: [{ role: 'user', content: fullPrompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    return {
      content,
      usage: {
        input_tokens: data.usage?.input_tokens,
        output_tokens: data.usage?.output_tokens,
        model: effectiveModel,
        provider: 'ANTHROPIC',
      },
      success: true,
    };
  }

  private async generateWithGoogle(
    prompt: string,
    context: string,
    model?: string,
  ): Promise<LlmResult> {
    const apiKey = this.config.get<string>('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      this.logger.warn('Google AI API key not configured, using mock');
      return this.generateMock(prompt, context);
    }

    const effectiveModel = model || 'gemini-pro';
    const fullPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${effectiveModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      content,
      usage: {
        prompt_token_count: data.usageMetadata?.promptTokenCount,
        candidates_token_count: data.usageMetadata?.candidatesTokenCount,
        total_token_count: data.usageMetadata?.totalTokenCount,
        model: effectiveModel,
        provider: 'GOOGLE',
      },
      success: true,
    };
  }

  private generateMock(prompt: string, context: string): LlmResult {
    this.logger.log('Using mock LLM service');

    const content = `# AI Generated Report

## Overview

This is a mock AI-generated report based on your request.

${
  context
    ? `## Document Analysis

Based on the provided document(s), here is the analysis:

- The document contains approximately ${context.length} characters
- Word count estimate: ${context.split(/\s+/).length} words

`
    : ''
}
## Summary

${
  prompt.toLowerCase().includes('summary')
    ? 'This is a summary of the provided content. The key points have been extracted and presented below.'
    : prompt.toLowerCase().includes('analysis')
      ? 'This is an analysis of the provided content. Various aspects have been examined and insights are provided.'
      : 'The content has been processed according to your request. Here are the results based on the given prompt.'
}

## Key Points

1. First key point from the analysis
2. Second important finding
3. Third observation
4. Additional insights

## Conclusion

This mock report demonstrates the report generation capability. In production, this would be replaced with actual AI-generated content from providers like OpenAI, Anthropic, or Google AI.

---
*Generated by Mock LLM Service*`;

    const promptTokens = Math.floor((prompt.length + (context?.length || 0)) / 4);
    const completionTokens = Math.floor(content.length / 4);

    return {
      content,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
        model: 'mock-gpt-4',
        provider: 'MOCK',
      },
      success: true,
    };
  }

  getDefaultModel(provider: LlmProvider): string {
    switch (provider) {
      case LlmProvider.OPENAI:
        return 'gpt-4';
      case LlmProvider.ANTHROPIC:
        return 'claude-3-sonnet-20240229';
      case LlmProvider.GOOGLE:
        return 'gemini-pro';
      default:
        return 'mock-gpt-4';
    }
  }
}
