import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import {
  RefineDescriptionDto,
  RefineDescriptionResponseDto,
  RefineDescriptionDataDto,
  EstimatePointsDto,
  EstimatePointsResponseDto,
  EstimatePointsDataDto,
  BreakdownIssueDto,
  BreakdownResponseDto,
  BreakdownDataDto,
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

  /**
   * Estimate story points using AI
   */
  async estimateStoryPoints(dto: EstimatePointsDto): Promise<EstimatePointsResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Estimating story points for issue: ${dto.issueId} (${dto.issueType})`,
      );

      // 1. Get prompts
      const { system, user } = this.promptService.getEstimatePrompt(dto);

      // 2. Check token limit
      const estimatedTokens = this.openaiService.estimateTokens(system + user);
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

      // 4. Parse JSON response
      const estimationData = this.parseEstimationResponse(completion.content);

      // 5. Validate Fibonacci scale
      this.validateFibonacciPoints(estimationData.suggestedPoints);

      // 6. Build response
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: estimationData,
        metadata: {
          model: completion.model,
          tokensUsed: completion.tokensUsed,
          processingTime,
        },
      };
    } catch (error) {
      this.logger.error('AI estimation failed', error.stack);

      return {
        success: false,
        error: {
          code: error.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'AI_SERVICE_ERROR',
          message:
            error.message || 'Failed to estimate story points. Please try again.',
          details: error.response?.data,
        },
      };
    }
  }

  /**
   * Parse AI estimation response (JSON format)
   */
  private parseEstimationResponse(text: string): EstimatePointsDataDto {
    try {
      // Remove markdown code blocks if present
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      // Parse JSON
      const parsed = JSON.parse(jsonText);

      // Validate required fields
      if (typeof parsed.suggestedPoints !== 'number') {
        throw new Error('Invalid suggestedPoints in AI response');
      }

      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        throw new Error('Invalid confidence score in AI response');
      }

      if (!parsed.reasoning || !parsed.reasoning.summary || !Array.isArray(parsed.reasoning.factors)) {
        throw new Error('Invalid reasoning structure in AI response');
      }

      return {
        suggestedPoints: parsed.suggestedPoints,
        confidence: parsed.confidence,
        reasoning: {
          summary: parsed.reasoning.summary,
          factors: parsed.reasoning.factors.map((f: any) => ({
            factor: f.factor || 'Unknown',
            impact: f.impact || 'Medium',
            description: f.description || '',
          })),
          recommendations: parsed.reasoning.recommendations || [],
        },
        alternatives: Array.isArray(parsed.alternatives)
          ? parsed.alternatives.map((alt: any) => ({
              points: alt.points,
              likelihood: alt.likelihood,
              reason: alt.reason,
            }))
          : [],
      };
    } catch (error) {
      this.logger.error('Failed to parse AI estimation response', error.stack);
      this.logger.error('Raw response:', text);

      throw new InternalServerErrorException(
        'Failed to parse AI estimation response. Invalid JSON format.',
      );
    }
  }

  /**
   * Validate that points are in Fibonacci scale
   */
  private validateFibonacciPoints(points: number): void {
    const validPoints = [1, 2, 3, 5, 8, 13, 21];
    if (!validPoints.includes(points)) {
      this.logger.warn(
        `AI suggested non-Fibonacci points: ${points}. Defaulting to closest valid value.`,
      );
      throw new InternalServerErrorException(
        `Invalid story points: ${points}. Must be Fibonacci number (1,2,3,5,8,13,21).`,
      );
    }
  }

  /**
   * Break down Epic/Story into sub-tasks using AI
   */
  async breakdownEpic(dto: BreakdownIssueDto): Promise<BreakdownResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Breaking down issue: ${dto.issueId} (${dto.issueType})`,
      );

      // 1. Get prompts
      const { system, user } = this.promptService.getBreakdownPrompt(dto);

      // 2. Check token limit (with higher max_tokens for breakdown)
      const breakdownMaxTokens = 6000;
      const estimatedTokens = this.openaiService.estimateTokens(system + user);
      if (this.openaiService.wouldExceedTokenLimit(estimatedTokens, breakdownMaxTokens)) {
        throw new InternalServerErrorException(
          'Description is too long. Please reduce the content.',
        );
      }

      // 3. Call OpenAI (with higher max_tokens for breakdown)
      const completion = await this.openaiService.createChatCompletion({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: breakdownMaxTokens, // Higher limit for complex breakdown responses
      });

      // 4. Parse JSON response
      const breakdownData = this.parseBreakdownResponse(completion.content);

      // 5. Validate breakdown
      this.validateBreakdown(breakdownData);

      // 6. Build response
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: breakdownData,
        metadata: {
          model: completion.model,
          tokensUsed: completion.tokensUsed,
          processingTime,
          cacheHit: false,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('AI breakdown failed', error.stack);

      return {
        success: false,
        error: {
          code: error.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'AI_SERVICE_ERROR',
          message:
            error.message || 'Failed to breakdown issue. Please try again.',
          details: error.response?.data,
        },
      };
    }
  }

  /**
   * Parse AI breakdown response (JSON format)
   */
  private parseBreakdownResponse(text: string): BreakdownDataDto {
    try {
      // Remove markdown code blocks if present
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      // Parse JSON
      const parsed = JSON.parse(jsonText);

      // Validate required fields
      if (!Array.isArray(parsed.subTasks) || parsed.subTasks.length === 0) {
        throw new Error('Invalid or empty subTasks array in AI response');
      }

      if (!parsed.reasoning || !parsed.validation) {
        throw new Error('Missing reasoning or validation in AI response');
      }

      // Transform and validate sub-tasks
      const subTasks = parsed.subTasks.map((task: any, index: number) => {
        if (!task.tempId || !task.name || !task.description) {
          throw new Error(`Sub-task ${index + 1} missing required fields`);
        }

        // Validate Fibonacci points for each sub-task
        const validPoints = [1, 2, 3, 5, 8, 13];
        if (!validPoints.includes(task.estimatedPoints)) {
          this.logger.warn(
            `Task ${task.tempId} has invalid points: ${task.estimatedPoints}. Adjusting to nearest valid value.`,
          );
          // Find closest Fibonacci number
          task.estimatedPoints = validPoints.reduce((prev, curr) =>
            Math.abs(curr - task.estimatedPoints) < Math.abs(prev - task.estimatedPoints) ? curr : prev
          );
        }

        return {
          tempId: task.tempId,
          name: task.name,
          description: task.description,
          descriptionHtml: task.descriptionHtml || `<p>${task.description}</p>`,
          estimatedPoints: task.estimatedPoints,
          estimationReasoning: task.estimationReasoning || '',
          taskType: task.taskType || 'FEATURE',
          technicalLayer: task.technicalLayer || 'CROSS',
          order: task.order || index + 1,
          dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
          canParallelize: task.canParallelize !== undefined ? task.canParallelize : true,
          priority: task.priority || 'MEDIUM',
          acceptanceCriteria: Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : [],
          tags: Array.isArray(task.tags) ? task.tags : [],
        };
      });

      // Build response
      return {
        subTasks,
        reasoning: {
          summary: parsed.reasoning.summary || '',
          coverageAreas: Array.isArray(parsed.reasoning.coverageAreas)
            ? parsed.reasoning.coverageAreas
            : [],
          assumptions: Array.isArray(parsed.reasoning.assumptions)
            ? parsed.reasoning.assumptions
            : [],
          risks: Array.isArray(parsed.reasoning.risks)
            ? parsed.reasoning.risks
            : [],
        },
        validation: {
          totalPoints: parsed.validation.totalPoints || 0,
          completeness: parsed.validation.completeness || 0,
          balanceScore: parsed.validation.balanceScore || 0,
          coveragePercentage: parsed.validation.coveragePercentage || 0,
        },
        dependencyGraph: parsed.dependencyGraph || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to parse AI breakdown response', error.stack);
      this.logger.error('Raw response:', text);

      throw new InternalServerErrorException(
        'Failed to parse AI breakdown response. Invalid JSON format.',
      );
    }
  }

  /**
   * Validate breakdown data
   */
  private validateBreakdown(data: BreakdownDataDto): void {
    // Check for circular dependencies
    const hasCircularDeps = this.detectCircularDependencies(data.subTasks);
    if (hasCircularDeps) {
      this.logger.warn('Circular dependencies detected in breakdown');
      throw new InternalServerErrorException(
        'Invalid breakdown: Circular dependencies detected',
      );
    }

    // Validate all dependencies reference valid task IDs
    const taskIds = new Set(data.subTasks.map((t) => t.tempId));
    for (const task of data.subTasks) {
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          throw new InternalServerErrorException(
            `Invalid dependency: Task ${task.tempId} depends on non-existent task ${depId}`,
          );
        }
      }
    }

    // Warn if total points seem unreasonable
    if (data.validation.totalPoints > 100) {
      this.logger.warn(
        `Breakdown has very high total points: ${data.validation.totalPoints}`,
      );
    }

    // Warn if too many sub-tasks
    if (data.subTasks.length > 20) {
      this.logger.warn(
        `Breakdown has many sub-tasks: ${data.subTasks.length}. Consider consolidating.`,
      );
    }
  }

  /**
   * Detect circular dependencies in task graph
   */
  private detectCircularDependencies(
    tasks: Array<{ tempId: string; dependencies: string[] }>,
  ): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Build adjacency map
    const graph = new Map<string, string[]>();
    for (const task of tasks) {
      graph.set(task.tempId, task.dependencies);
    }

    // DFS to detect cycle
    const hasCycle = (taskId: string): boolean => {
      if (!visited.has(taskId)) {
        visited.add(taskId);
        recursionStack.add(taskId);

        const deps = graph.get(taskId) || [];
        for (const depId of deps) {
          if (!visited.has(depId)) {
            if (hasCycle(depId)) {
              return true;
            }
          } else if (recursionStack.has(depId)) {
            // Found a cycle
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    // Check each task
    for (const task of tasks) {
      if (hasCycle(task.tempId)) {
        return true;
      }
    }

    return false;
  }
}
