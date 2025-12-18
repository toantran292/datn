import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate embedding vector for text using OpenAI ada-002
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const cleanedText = this.cleanText(text);

      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: cleanedText,
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert issue to searchable text representation
   */
  issueToText(issue: {
    name: string;
    description?: string | null;
    type: string;
    priority: string;
    point?: number | null;
  }): string {
    const parts = [
      `Title: ${issue.name}`,
      `Type: ${issue.type}`,
      `Priority: ${issue.priority}`,
    ];

    if (issue.description) {
      parts.push(`Description: ${issue.description}`);
    }

    if (issue.point) {
      parts.push(`Story Points: ${issue.point}`);
    }

    return parts.join('\n');
  }

  /**
   * Clean and normalize text before embedding
   */
  private cleanText(text: string): string {
    return (
      text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s.,!?-]/g, '') // Remove special chars except basic punctuation
        .trim()
        .slice(0, 8000) // OpenAI limit: 8191 tokens ≈ 8000 chars
    );
  }
}
