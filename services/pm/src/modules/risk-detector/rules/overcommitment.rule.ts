import { Injectable, Logger } from '@nestjs/common';
import {
  IRiskRule,
  RiskCategory,
  RiskResult,
  SprintContext,
  IssueData,
  SprintHistoryData,
  RiskRecommendation,
} from '../interfaces/risk-rule.interface';
import { RiskSeverity } from '../dto';
import { OpenAIService } from '../../ai/openai.service';

/**
 * Detects sprint overcommitment risk
 *
 * Rule Logic:
 * - Calculate committed points (sum of all issue points in sprint)
 * - Calculate average velocity from last 3 sprints
 * - If committed > avgVelocity * 1.2 (20% buffer) → CRITICAL risk
 * - If committed > avgVelocity * 1.1 (10% buffer) → MEDIUM risk
 */
@Injectable()
export class OvercommitmentRule implements IRiskRule {
  private readonly logger = new Logger(OvercommitmentRule.name);

  readonly id = 'OVERCOMMITMENT';
  readonly name = 'Sprint Overcommitment Detection';
  readonly category = RiskCategory.CAPACITY;
  readonly severity = RiskSeverity.CRITICAL;

  constructor(private readonly openAIService: OpenAIService) {}

  async check(context: SprintContext): Promise<RiskResult | null> {
    const { sprint, issues, sprintHistory, teamCapacity } = context;

    // Only check for active sprints
    if (sprint.status !== 'ACTIVE') {
      return null;
    }

    // Calculate committed points
    const committedPoints = this.calculateCommittedPoints(issues, sprint.id);

    if (committedPoints === 0) {
      return null; // No points committed, no risk
    }

    // Calculate average velocity
    const avgVelocity = this.calculateAverageVelocity(
      sprintHistory,
      teamCapacity,
    );

    if (avgVelocity === 0) {
      return null; // Cannot determine risk without velocity data
    }

    // Calculate overcommitment ratio
    const ratio = committedPoints / avgVelocity;

    // Determine severity
    let severity: RiskSeverity;
    let thresholdDescription: string;

    if (ratio > 1.3) {
      // >130% committed
      severity = RiskSeverity.CRITICAL;
      thresholdDescription = 'nghiêm trọng';
    } else if (ratio > 1.2) {
      // >120% committed
      severity = RiskSeverity.CRITICAL;
      thresholdDescription = 'cao';
    } else if (ratio > 1.1) {
      // >110% committed
      severity = RiskSeverity.MEDIUM;
      thresholdDescription = 'vừa phải';
    } else {
      return null; // Within acceptable range
    }

    const overcommitmentPercentage = Math.round((ratio - 1) * 100);
    const recommendedPoints = Math.round(avgVelocity * 1.1);
    const excessPoints = committedPoints - recommendedPoints;

    // Find low-priority issues to suggest for removal
    const lowPriorityIssues = issues
      .filter(
        (i) => i.sprintId === sprint.id && i.priority === 'LOW' && i.point,
      )
      .sort((a, b) => (b.point || 0) - (a.point || 0)) // Sort by points descending
      .slice(0, 3); // Top 3 low-priority issues

    const suggestedIssues = lowPriorityIssues.map((i) => i.id);

    this.logger.warn(
      `Overcommitment detected for sprint ${sprint.id}: ${committedPoints} points (${overcommitmentPercentage}% over)`,
    );

    // Generate AI-powered recommendations
    const recommendations = await this.generateAIRecommendations({
      sprint,
      issues,
      committedPoints,
      avgVelocity,
      ratio,
      overcommitmentPercentage,
      recommendedPoints,
      excessPoints,
      lowPriorityIssues,
      suggestedIssues,
    });

    return {
      type: this.id,
      severity,
      title: `Sprint Overcommitment ${this.getSeverityLabel(severity)}`,
      description: `Sprint đang bị overcommit ${overcommitmentPercentage}%. Team cam kết ${committedPoints} điểm nhưng velocity trung bình chỉ ${Math.round(avgVelocity)} điểm. Mức độ overcommitment: ${thresholdDescription}.`,
      impactScore: Math.min(10, Math.floor(ratio * 5)),
      metadata: {
        committedPoints,
        avgVelocity: Math.round(avgVelocity),
        overcommitmentRatio: ratio,
        overcommitmentPercentage,
        recommendedPoints,
        excessPoints,
      },
      recommendations,
    };
  }

  /**
   * Calculate total committed points in sprint
   */
  private calculateCommittedPoints(
    issues: IssueData[],
    sprintId: string,
  ): number {
    return issues
      .filter((issue) => issue.sprintId === sprintId && issue.point !== null)
      .reduce((sum, issue) => sum + (issue.point || 0), 0);
  }

  /**
   * Calculate average velocity from recent sprint history
   * Falls back to team capacity if no history
   */
  private calculateAverageVelocity(
    history: SprintHistoryData[],
    teamCapacity?: number,
  ): number {
    if (history.length === 0) {
      // No history, use team capacity as fallback
      return teamCapacity || 0;
    }

    // Use last 3 sprints for average
    const recentSprints = history.slice(-3);

    const totalVelocity = recentSprints.reduce(
      (sum, sprint) => sum + sprint.velocity,
      0,
    );

    return totalVelocity / recentSprints.length;
  }

  private getSeverityLabel(severity: RiskSeverity): string {
    switch (severity) {
      case RiskSeverity.CRITICAL:
        return 'Nghiêm Trọng';
      case RiskSeverity.MEDIUM:
        return 'Trung Bình';
      case RiskSeverity.LOW:
        return 'Thấp';
      default:
        return '';
    }
  }

  /**
   * Generate AI-powered recommendations using OpenAI
   */
  private async generateAIRecommendations(params: {
    sprint: any;
    issues: IssueData[];
    committedPoints: number;
    avgVelocity: number;
    ratio: number;
    overcommitmentPercentage: number;
    recommendedPoints: number;
    excessPoints: number;
    lowPriorityIssues: IssueData[];
    suggestedIssues: string[];
  }): Promise<RiskRecommendation[]> {
    const {
      sprint,
      issues,
      committedPoints,
      avgVelocity,
      ratio,
      overcommitmentPercentage,
      recommendedPoints,
      excessPoints,
      lowPriorityIssues,
      suggestedIssues,
    } = params;

    try {
      // Prepare sprint issues summary for AI
      const sprintIssues = issues
        .filter((i) => i.sprintId === sprint.id)
        .map((i) => ({
          name: i.name,
          priority: i.priority,
          type: i.type,
          points: i.point,
          assignees: i.assignees.length,
        }));

      const prompt = `You are an experienced Scrum Master and Agile Coach. Analyze this sprint overcommitment situation and provide 3 specific, actionable recommendations.

**Sprint Context:**
- Sprint Name: ${sprint.name}
- Committed Points: ${committedPoints}
- Team Average Velocity: ${Math.round(avgVelocity)} points (from last 3 sprints)
- Overcommitment Ratio: ${ratio.toFixed(2)} (${overcommitmentPercentage}% over capacity)
- Recommended Commitment: ${recommendedPoints} points (with 10% buffer)
- Excess Points: ${excessPoints} points need to be removed

**Sprint Issues (${sprintIssues.length} total):**
${sprintIssues
  .slice(0, 10)
  .map(
    (i, idx) =>
      `${idx + 1}. [${i.priority}] ${i.name} - ${i.points} points (${i.assignees} assignees)`,
  )
  .join('\n')}
${sprintIssues.length > 10 ? `... and ${sprintIssues.length - 10} more issues` : ''}

**Low-Priority Issues Available to Remove:**
${lowPriorityIssues.length > 0 ? lowPriorityIssues.map((i) => `- ID: ${i.id} | ${i.name} (${i.point} points)`).join('\n') : 'None found'}

**Task:**
Generate exactly 3 recommendations in JSON format. Each recommendation should be:
1. Specific and actionable (not generic advice)
2. Consider the actual issues and team capacity
3. Include realistic effort estimates
4. Provide measurable expected impact

IMPORTANT RULES for "suggestedIssues" field:
- For priority 1 recommendation: Include the ACTUAL UUID strings from the low-priority issues list
- NEVER include issue names or descriptions in suggestedIssues - ONLY UUIDs
- UUIDs are in format: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
- If no specific issues to suggest, use empty array []

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "priority": 1,
    "action": "Hành động cụ thể (bằng tiếng Việt)",
    "expectedImpact": "Tác động dự kiến (số liệu cụ thể)",
    "effortEstimate": "Thời gian cần thiết",
    "suggestedIssues": ["04f55928-80f2-4345-a703-ccadba596f3e", "8c0cff52-aca5-45cc-a825-9c6ebd52cdcf"]
  },
  {
    "priority": 2,
    "action": "...",
    "expectedImpact": "...",
    "effortEstimate": "...",
    "suggestedIssues": []
  },
  {
    "priority": 3,
    "action": "...",
    "expectedImpact": "...",
    "effortEstimate": "...",
    "suggestedIssues": []
  }
]

IMPORTANT: All text must be in Vietnamese language (tiếng Việt).`;

      const response = await this.openAIService.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert Scrum Master. Always respond in Vietnamese language (tiếng Việt) with valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      // Parse AI response
      let aiRecommendations: RiskRecommendation[];
      try {
        // Remove markdown code blocks if present
        let cleanedResponse = response.content.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse
            .replace(/```\n?/g, '')
            .trim();
        }

        aiRecommendations = JSON.parse(cleanedResponse);

        // Add suggested issues to first recommendation if AI didn't include them
        if (
          aiRecommendations[0] &&
          (!aiRecommendations[0].suggestedIssues ||
            aiRecommendations[0].suggestedIssues.length === 0)
        ) {
          aiRecommendations[0].suggestedIssues = suggestedIssues;
        }

        this.logger.log(
          `AI generated ${aiRecommendations.length} recommendations for sprint ${sprint.id}`,
        );
      } catch (parseError) {
        this.logger.warn(
          `Failed to parse AI response, using fallback: ${parseError.message}`,
        );
        throw parseError;
      }

      return aiRecommendations;
    } catch (error) {
      this.logger.error(
        `AI recommendation generation failed: ${error.message}`,
      );

      // Fallback to hard-coded recommendations
      return this.getFallbackRecommendations(params);
    }
  }

  /**
   * Fallback recommendations if AI fails
   */
  private getFallbackRecommendations(params: {
    avgVelocity: number;
    recommendedPoints: number;
    lowPriorityIssues: IssueData[];
    suggestedIssues: string[];
  }): RiskRecommendation[] {
    const { avgVelocity, recommendedPoints, lowPriorityIssues, suggestedIssues } = params;

    return [
      {
        priority: 1,
        action: `Di chuyển ${lowPriorityIssues.length > 0 ? lowPriorityIssues.length : '2-3'} stories có priority thấp về backlog`,
        expectedImpact: `Giảm commitment xuống ${recommendedPoints} điểm (optimal range)`,
        effortEstimate: '5-10 phút',
        suggestedIssues:
          suggestedIssues.length > 0 ? suggestedIssues : undefined,
      },
      {
        priority: 2,
        action:
          'Extend sprint duration thêm 1-2 ngày nếu không thể giảm scope',
        expectedImpact: `Tăng capacity lên ~${Math.round(avgVelocity * 1.15)} điểm`,
        effortEstimate: 'Requires PO approval',
      },
      {
        priority: 3,
        action: 'Review sprint goal và đảm bảo team hiểu rõ priorities',
        expectedImpact:
          'Team có thể tự identify những tasks ít critical để defer',
        effortEstimate: '15-30 phút (daily standup)',
      },
    ];
  }
}
