import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAIService } from './openai.service';
import {
  SprintSummaryDto,
  SprintSummaryResponseDto,
  SprintSummaryDataDto,
  SprintOverviewDto,
  SprintMetadataDto,
  PositiveHighlightDto,
  AreaOfConcernDto,
  RecommendationDto,
  StrengthDto,
  SprintSentiment,
  SeverityLevel,
  PriorityLevel,
  ToneType,
} from './dto';

interface SprintAnalyticsData {
  sprint: any;
  totalIssues: number;
  completedIssues: number;
  totalPoints: number;
  completedPoints: number;
  bugCount: number;
  completedBugCount: number;
  averageCompletionTime: number; // hours
  velocityTrend: number; // % change
  issuesByStatus: any[];
  issuesByType: any[];
  issuesByPriority: any[];
}

@Injectable()
export class AISprintSummaryService {
  private readonly logger = new Logger(AISprintSummaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
  ) {}

  /**
   * Generate AI Sprint Summary (non-streaming)
   */
  async generateSprintSummary(
    dto: SprintSummaryDto,
  ): Promise<SprintSummaryResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(`Generating sprint summary for: ${dto.sprintId}`);

      // 1. Collect sprint data
      const analyticsData = await this.collectSprintData(dto.sprintId);

      // 2. Generate prompts
      const { system, user } = this.getSprintSummaryPrompts(
        analyticsData,
        dto.tone || ToneType.FRIENDLY,
      );

      // 3. Call OpenAI
      const completion = await this.openaiService.createChatCompletion({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      // 4. Parse AI response
      const summary = this.parseAIResponse(
        completion.content,
        analyticsData,
      );

      // 5. Calculate confidence
      const confidence = this.calculateConfidence(analyticsData);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Sprint summary generated in ${processingTime}ms`,
      );

      return {
        success: true,
        summary,
        confidence,
      };
    } catch (error) {
      this.logger.error('Failed to generate sprint summary', error.stack);
      throw error;
    }
  }

  /**
   * Generate AI Sprint Summary with streaming
   */
  async *generateSprintSummaryStream(
    dto: SprintSummaryDto,
  ): AsyncGenerator<any> {
    try {
      this.logger.log(`Streaming sprint summary for: ${dto.sprintId}`);

      // 1. Collect sprint data
      yield { type: 'progress', message: 'Collecting sprint data...' };
      const analyticsData = await this.collectSprintData(dto.sprintId);

      // 2. Send overview immediately
      const completionRate =
        analyticsData.totalIssues > 0
          ? analyticsData.completedIssues / analyticsData.totalIssues
          : 0;
      const sentiment: SprintSentiment =
        completionRate >= 0.75
          ? SprintSentiment.POSITIVE
          : completionRate >= 0.5
            ? SprintSentiment.NEUTRAL
            : SprintSentiment.NEEDS_IMPROVEMENT;

      const overview: SprintOverviewDto = {
        sprintName: analyticsData.sprint.name,
        startDate: analyticsData.sprint.startDate
          ? new Date(analyticsData.sprint.startDate).toISOString()
          : '',
        endDate: analyticsData.sprint.endDate
          ? new Date(analyticsData.sprint.endDate).toISOString()
          : '',
        duration: this.calculateDuration(
          analyticsData.sprint.startDate,
          analyticsData.sprint.endDate,
        ),
        completionRate,
        velocityScore: analyticsData.completedPoints,
        overallSentiment: sentiment,
      };

      yield { type: 'overview', value: overview };

      // 3. Send metadata
      const metadata: SprintMetadataDto = {
        totalIssues: analyticsData.totalIssues,
        completedIssues: analyticsData.completedIssues,
        totalPoints: analyticsData.totalPoints,
        completedPoints: analyticsData.completedPoints,
        averageCompletionTime: analyticsData.averageCompletionTime,
        bugCount: analyticsData.bugCount,
        velocityTrend: analyticsData.velocityTrend,
      };

      yield { type: 'metadata', value: metadata };

      // 4. Generate AI insights
      yield { type: 'progress', message: 'Analyzing sprint performance...' };

      const { system, user } = this.getSprintSummaryPrompts(
        analyticsData,
        dto.tone || ToneType.FRIENDLY,
      );

      // 5. Stream AI response
      let accumulatedContent = '';
      for await (const chunk of this.openaiService.createStreamingChatCompletion({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      })) {
        accumulatedContent += chunk;
        // Send progress heartbeat
        yield { type: 'progress', message: 'Generating insights...' };
      }

      // 6. Parse complete response
      yield { type: 'progress', message: 'Finalizing summary...' };
      const parsed = this.parseJSONResponse(accumulatedContent);

      // 7. Stream each section
      if (parsed.positives) {
        for (const positive of parsed.positives) {
          yield { type: 'positive', value: positive };
        }
      }

      if (parsed.concerns) {
        for (const concern of parsed.concerns) {
          yield { type: 'concern', value: concern };
        }
      }

      if (parsed.recommendations) {
        for (const recommendation of parsed.recommendations) {
          yield { type: 'recommendation', value: recommendation };
        }
      }

      if (parsed.strengths) {
        for (const strength of parsed.strengths) {
          yield { type: 'strength', value: strength };
        }
      }

      // 8. Send closing message
      if (parsed.closingMessage) {
        yield { type: 'closing', value: parsed.closingMessage };
      }

      // 9. Send confidence
      const confidence = this.calculateConfidence(analyticsData);
      yield { type: 'complete', value: { confidence } };
    } catch (error) {
      this.logger.error('Sprint summary streaming failed', error.stack);
      yield {
        type: 'error',
        message: error.message || 'Failed to generate sprint summary',
      };
    }
  }

  /**
   * Parse JSON from AI response (handles markdown code blocks)
   */
  private parseJSONResponse(content: string): any {
    try {
      let cleanedResponse = content.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse
          .replace(/```json\n?/, '')
          .replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse
          .replace(/```\n?/, '')
          .replace(/\n?```$/, '');
      }
      return JSON.parse(cleanedResponse);
    } catch (error) {
      this.logger.error('Failed to parse JSON response', error);
      return {
        positives: [],
        concerns: [],
        recommendations: [],
        strengths: [],
        closingMessage: 'Không thể tạo summary. Vui lòng thử lại.',
      };
    }
  }

  /**
   * Collect and analyze sprint data
   */
  private async collectSprintData(
    sprintId: string,
  ): Promise<SprintAnalyticsData> {
    // Get sprint with all issues
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        issues: {
          include: {
            status: true,
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint with ID ${sprintId} not found`);
    }

    // Define "done" keywords
    const doneKeywords = ['DONE', 'HOÀN THÀNH', 'COMPLETED'];

    // Calculate metrics
    const totalIssues = sprint.issues.length;
    const completedIssues = sprint.issues.filter((issue) => {
      const statusName = issue.status.name?.toUpperCase() || '';
      return doneKeywords.some((keyword) => statusName.includes(keyword));
    }).length;

    const totalPoints =
      sprint.issues.reduce((sum, issue) => sum + (Number(issue.point) || 0), 0);
    const completedPoints = sprint.issues
      .filter((issue) => {
        const statusName = issue.status.name?.toUpperCase() || '';
        return doneKeywords.some((keyword) => statusName.includes(keyword));
      })
      .reduce((sum, issue) => sum + (Number(issue.point) || 0), 0);

    // Bug counts
    const bugCount = sprint.issues.filter((i) => i.type === 'BUG').length;
    const completedBugCount = sprint.issues.filter((issue) => {
      if (issue.type !== 'BUG') return false;
      const statusName = issue.status.name?.toUpperCase() || '';
      return doneKeywords.some((keyword) => statusName.includes(keyword));
    }).length;

    // Average completion time (if we have completedAt field)
    const completedWithTime = sprint.issues.filter((issue) => {
      const statusName = issue.status.name?.toUpperCase() || '';
      const isDone = doneKeywords.some((keyword) =>
        statusName.includes(keyword),
      );
      return isDone && issue.createdAt;
    });

    const averageCompletionTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce((sum, issue) => {
            const created = new Date(issue.createdAt).getTime();
            const completed = new Date(issue.updatedAt).getTime(); // Using updatedAt as proxy
            const hours = (completed - created) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / completedWithTime.length
        : 0;

    // Get previous sprint for velocity trend
    const previousSprint = await this.prisma.sprint.findFirst({
      where: {
        projectId: sprint.projectId,
        createdAt: { lt: sprint.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        issues: {
          include: {
            status: true,
          },
        },
      },
    });

    let velocityTrend = 0;
    if (previousSprint && previousSprint.issues) {
      const prevCompletedPoints = previousSprint.issues
        .filter((issue) => {
          const statusName = issue.status.name?.toUpperCase() || '';
          return doneKeywords.some((keyword) => statusName.includes(keyword));
        })
        .reduce((sum, issue) => sum + (Number(issue.point) || 0), 0);

      if (prevCompletedPoints > 0) {
        velocityTrend =
          ((completedPoints - prevCompletedPoints) / prevCompletedPoints) * 100;
      }
    }

    // Group issues by status, type, priority
    const issuesByStatus = this.groupBy(sprint.issues, 'status.name');
    const issuesByType = this.groupBy(sprint.issues, 'type');
    const issuesByPriority = this.groupBy(sprint.issues, 'priority');

    return {
      sprint,
      totalIssues,
      completedIssues,
      totalPoints,
      completedPoints,
      bugCount,
      completedBugCount,
      averageCompletionTime,
      velocityTrend,
      issuesByStatus,
      issuesByType,
      issuesByPriority,
    };
  }

  /**
   * Generate prompts for sprint summary
   */
  private getSprintSummaryPrompts(
    data: SprintAnalyticsData,
    tone: ToneType,
  ): { system: string; user: string } {
    const system = `Bạn là một AI Sprint Analytics Expert, chuyên phân tích hiệu suất của Agile sprints và đưa ra insights có giá trị cho development teams.

Nhiệm vụ của bạn:
1. Phân tích dữ liệu sprint một cách khách quan và chính xác
2. Nhận diện patterns và trends trong performance
3. Đưa ra recommendations cụ thể, có thể thực hiện được
4. Tạo closing message phù hợp với sentiment của sprint
5. Sử dụng tone ${this.getToneDescription(tone)}

Nguyên tắc:
- Luôn cân bằng giữa positives và concerns
- Recommendations phải actionable và realistic
- Closing message phải chân thành và phù hợp với kết quả
- Sử dụng emojis một cách vừa phải để tạo friendly tone
- Tập trung vào data-driven insights, không chỉ general advice

Output format: JSON với cấu trúc sau:
{
  "positives": [{ "title": "...", "description": "...", "metric": { "value": 85, "unit": "%" } }],
  "concerns": [{ "title": "...", "description": "...", "severity": "low|medium|high" }],
  "recommendations": [{ "title": "...", "description": "...", "actionable": true, "priority": "low|medium|high" }],
  "strengths": [{ "title": "...", "description": "..." }],
  "closingMessage": "2-3 câu phù hợp với kết quả sprint..."
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks, just pure JSON.`;

    const completionRate =
      data.totalIssues > 0
        ? (data.completedIssues / data.totalIssues) * 100
        : 0;
    const velocityRate =
      data.totalPoints > 0
        ? (data.completedPoints / data.totalPoints) * 100
        : 0;

    const user = `Hãy phân tích Sprint "${data.sprint.name}" với dữ liệu sau:

**Thời gian:**
- Bắt đầu: ${data.sprint.startDate ? new Date(data.sprint.startDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
- Kết thúc: ${data.sprint.endDate ? new Date(data.sprint.endDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
- Thời lượng: ${this.calculateDuration(data.sprint.startDate, data.sprint.endDate)} ngày

**Completion Metrics:**
- Issues planned: ${data.totalIssues}
- Issues completed: ${data.completedIssues}
- Completion rate: ${completionRate.toFixed(1)}%
- Story points planned: ${data.totalPoints}
- Story points completed: ${data.completedPoints}
- Velocity: ${data.completedPoints} points

**Issue Breakdown:**
- By status: ${JSON.stringify(data.issuesByStatus)}
- By type: ${JSON.stringify(data.issuesByType)}
- By priority: ${JSON.stringify(data.issuesByPriority)}

**Quality Metrics:**
- Bugs trong sprint: ${data.bugCount}
- Bugs đã fix: ${data.completedBugCount}
- Average completion time: ${data.averageCompletionTime.toFixed(1)} hours

**Comparison với Sprint trước:**
- Velocity change: ${data.velocityTrend.toFixed(1)}%

**Sprint Goal:**
${data.sprint.goal || 'Không có goal được định nghĩa'}

Hãy tạo một sprint summary đầy đủ với:
1. Positive highlights (3-5 điểm tích cực dựa trên metrics)
2. Areas of concern (2-4 điểm cần lưu ý nếu có)
3. Recommendations (3-5 gợi ý cụ thể, actionable)
4. Strengths to maintain (2-3 điểm mạnh)
5. Closing message (2-3 câu, tone phù hợp với kết quả: ${completionRate > 75 ? 'chúc mừng và động viên' : completionRate > 50 ? 'ghi nhận và khích lệ' : 'an ủi và động viên cải thiện'})

QUAN TRỌNG:
- Sử dụng tone ${tone}
- Tất cả nội dung (title, description, closingMessage) PHẢI viết bằng TIẾNG VIỆT
- Đảm bảo insights dựa trên dữ liệu thực tế
- Return ONLY valid JSON, không có markdown formatting

Ví dụ format tiếng Việt:
{
  "positives": [{ "title": "Hoàn Thành Tốt Các Story Points", "description": "Team đã hoàn thành 85% story points đã lên kế hoạch...", "metric": { "value": 85, "unit": "%" } }],
  "concerns": [{ "title": "Tỷ Lệ Bug Cao", "description": "Số lượng bugs phát sinh trong sprint cao hơn mức trung bình...", "severity": "medium" }],
  "recommendations": [{ "title": "Tăng Cường Code Review", "description": "Triển khai quy trình code review nghiêm ngặt hơn để giảm bugs...", "actionable": true, "priority": "high" }],
  "strengths": [{ "title": "Teamwork Tốt", "description": "Các thành viên hỗ trợ nhau hiệu quả trong việc giải quyết blockers" }],
  "closingMessage": "Sprint này đã có nhiều tiến bộ đáng ghi nhận. Hãy tiếp tục duy trì động lực và cải thiện các điểm yếu đã xác định!"
}`;

    return { system, user };
  }

  /**
   * Parse AI response into structured data
   */
  private parseAIResponse(
    aiResponse: string,
    data: SprintAnalyticsData,
  ): SprintSummaryDataDto {
    try {
      // Clean response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(cleanedResponse);

      // Calculate sentiment based on completion rate
      const completionRate =
        data.totalIssues > 0 ? data.completedIssues / data.totalIssues : 0;
      const sentiment: SprintSentiment =
        completionRate >= 0.75
          ? SprintSentiment.POSITIVE
          : completionRate >= 0.5
            ? SprintSentiment.NEUTRAL
            : SprintSentiment.NEEDS_IMPROVEMENT;

      // Build overview
      const overview: SprintOverviewDto = {
        sprintName: data.sprint.name,
        startDate: data.sprint.startDate
          ? new Date(data.sprint.startDate).toISOString()
          : '',
        endDate: data.sprint.endDate
          ? new Date(data.sprint.endDate).toISOString()
          : '',
        duration: this.calculateDuration(
          data.sprint.startDate,
          data.sprint.endDate,
        ),
        completionRate,
        velocityScore: data.completedPoints,
        overallSentiment: sentiment,
      };

      // Build metadata
      const metadata: SprintMetadataDto = {
        totalIssues: data.totalIssues,
        completedIssues: data.completedIssues,
        totalPoints: data.totalPoints,
        completedPoints: data.completedPoints,
        averageCompletionTime: data.averageCompletionTime,
        bugCount: data.bugCount,
        velocityTrend: data.velocityTrend,
      };

      return {
        overview,
        positives: parsed.positives || [],
        concerns: parsed.concerns || [],
        recommendations: parsed.recommendations || [],
        strengths: parsed.strengths || [],
        closingMessage: parsed.closingMessage || '',
        metadata,
      };
    } catch (error) {
      this.logger.error('Failed to parse AI response', error);
      throw new Error('Failed to parse AI response: ' + error.message);
    }
  }

  /**
   * Calculate confidence score based on data quality
   */
  private calculateConfidence(data: SprintAnalyticsData): number {
    let confidence = 0.5; // Base confidence

    // More issues = more data = higher confidence
    if (data.totalIssues >= 10) confidence += 0.2;
    else if (data.totalIssues >= 5) confidence += 0.1;

    // Sprint has dates = more structured
    if (data.sprint.startDate && data.sprint.endDate) confidence += 0.1;

    // Sprint has goal = better context
    if (data.sprint.goal && data.sprint.goal.length > 10) confidence += 0.1;

    // Has previous sprint data for comparison
    if (data.velocityTrend !== 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Helper: Calculate sprint duration in days
   */
  private calculateDuration(startDate: Date | null, endDate: Date | null): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Helper: Get tone description
   */
  private getToneDescription(tone: ToneType): string {
    switch (tone) {
      case ToneType.PROFESSIONAL:
        return 'professional, formal, business-like, focus on metrics';
      case ToneType.MOTIVATIONAL:
        return 'uplifting, inspirational, positive focus, encouraging';
      case ToneType.FRIENDLY:
      default:
        return 'friendly, casual, encouraging, balanced';
    }
  }

  /**
   * Helper: Group array by key
   */
  private groupBy(array: any[], key: string): any {
    return array.reduce((result, item) => {
      const keys = key.split('.');
      let value = item;
      for (const k of keys) {
        value = value?.[k];
      }
      const group = value || 'Unknown';
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }
}
