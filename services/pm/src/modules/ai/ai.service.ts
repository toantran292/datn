import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import {
  RefineDescriptionDto,
  RefineDescriptionResponseDto,
  RefineDescriptionDataDto,
} from './dto';
import { OpenAIService } from './openai.service';
import { PromptService } from './prompt.service';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly promptService: PromptService,
  ) {}

  /**
   * Refine issue description using AI
   */
  async refineDescription(dto: RefineDescriptionDto): Promise<RefineDescriptionResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Refining description for issue: ${dto.issueId} (${dto.issueType})`,
      );

      // 1. Get prompts
      const { system, user } = this.promptService.getRefinePrompt(dto);

      // 2. Check token limit
      const estimatedTokens =
        this.openaiService.estimateTokens(system + user);
      if (this.openaiService.wouldExceedTokenLimit(estimatedTokens)) {
        throw new InternalServerErrorException(
          'Description is too long. Please reduce the content.',
        );
      }

      // 3. Call OpenAI
      const completion = await this.openaiService.createChatCompletion({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });

      // 4. Parse response
      const { markdown, html, improvements } = this.parseAIResponse(
        completion.content,
      );

      // 5. Calculate confidence
      const confidence = this.calculateConfidence(
        dto.currentDescription,
        markdown,
        improvements.length,
      );

      // 6. Build response
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          refinedDescription: markdown,
          refinedDescriptionHtml: html,
          improvements,
          confidence,
        },
        metadata: {
          model: completion.model,
          tokensUsed: completion.tokensUsed,
          processingTime,
        },
      };
    } catch (error) {
      this.logger.error('AI refine failed', error.stack);

      return {
        success: false,
        error: {
          code: error.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'AI_SERVICE_ERROR',
          message:
            error.message || 'Failed to refine description. Please try again.',
          details: error.response?.data,
        },
      };
    }
  }

  /**
   * Parse AI response to extract HTML and improvements
   */
  private parseAIResponse(text: string): {
    markdown: string;
    html: string;
    improvements: string[];
  } {
    // AI now returns HTML directly, no need to convert
    const html = text.trim();

    // Keep markdown same as html for backwards compatibility
    const markdown = html;

    // Extract improvements (now checks HTML tags instead of markdown)
    const improvements = this.extractImprovements(html, text);

    return { markdown, html, improvements };
  }

  /**
   * Extract list of improvements made
   * Now checks HTML tags instead of markdown
   */
  private extractImprovements(refined: string, original: string): string[] {
    const improvements: string[] = [];

    // Check for structure (HTML version)
    if (refined.includes('<h2>Tóm tắt</h2>') || refined.includes('<h2>')) {
      improvements.push('Thêm cấu trúc rõ ràng với các sections');
    }

    // Check for expansion
    if (refined.length > original.length * 1.5) {
      improvements.push('Mở rộng mô tả với chi tiết cụ thể');
    }

    // Check for acceptance criteria (HTML version)
    if (refined.includes('<h2>Acceptance Criteria</h2>') || refined.includes('Definition of Done')) {
      improvements.push('Thêm acceptance criteria với checklist');
    }

    // Check for detailed implementation (HTML version)
    if (refined.includes('<h2>Chi tiết thực hiện</h2>')) {
      improvements.push('Thêm chi tiết thực hiện cụ thể');
    }

    // Check for objectives (HTML version)
    if (refined.includes('<h2>Mục tiêu</h2>')) {
      improvements.push('Làm rõ mục tiêu cần đạt được');
    }

    // Check for formatting improvements (HTML version)
    if (refined.includes('<ul>') || refined.includes('<ol>') || refined.includes('<strong>')) {
      improvements.push('Cải thiện formatting với lists và emphasis');
    }

    // Default improvements if none detected
    if (improvements.length === 0) {
      improvements.push('Cải thiện cấu trúc và ngữ pháp');
      improvements.push('Format theo template chuẩn');
    }

    return improvements;
  }

  /**
   * Calculate confidence score based on heuristics
   * Now checks HTML tags instead of markdown
   */
  private calculateConfidence(
    original: string,
    refined: string,
    improvementCount: number,
  ): number {
    let score = 0.5; // Base score

    // Length ratio
    const lengthRatio = refined.length / original.length;
    if (lengthRatio > 2) score += 0.2;
    else if (lengthRatio > 1.5) score += 0.1;

    // Has proper structure (HTML version)
    if (refined.includes('<h2>Tóm tắt</h2>')) score += 0.1;
    if (refined.includes('<h2>Mô tả chi tiết</h2>')) score += 0.05;
    if (refined.includes('<h2>Mục tiêu</h2>')) score += 0.05;

    // Has lists (actionable)
    if (refined.includes('<ul>') || refined.includes('<ol>')) score += 0.1;

    // Number of improvements
    if (improvementCount >= 5) score += 0.1;
    else if (improvementCount >= 3) score += 0.05;

    // Has formatting (HTML version)
    if (refined.includes('<strong>') || refined.includes('<pre>')) {
      score += 0.05;
    }

    // Ensure score is between 0 and 1
    return Math.min(Math.max(score, 0), 1);
  }
}
