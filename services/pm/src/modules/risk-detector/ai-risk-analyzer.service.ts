import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../ai/openai.service';
import { RagService } from '../rag/rag.service';

/**
 * AI-First Risk Analysis Service
 *
 * This service uses GPT-4o-mini as the PRIMARY risk detection engine.
 * It performs comprehensive sprint analysis and detects all risk types in one AI call.
 */
@Injectable()
export class AIRiskAnalyzerService {
  private readonly logger = new Logger(AIRiskAnalyzerService.name);

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly ragService: RagService,
  ) {}

  /**
   * Analyze sprint using AI to detect ALL risks and provide comprehensive insights
   * This is the PRIMARY detection method.
   */
  async analyzeSprintRisks(context: SprintAnalysisContext): Promise<AIRiskAnalysisResult> {
    this.logger.log(`AI analyzing sprint: ${context.sprint.name} (${context.sprint.id})`);

    const startTime = Date.now();

    try {
      // Get RAG context for historical insights
      const ragContext = await this.getRAGContext(context);

      // Build comprehensive prompt
      const prompt = this.buildAnalysisPrompt(context, ragContext);

      // Call GPT-4o-mini for deep analysis
      const response = await this.openAIService.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 3000,
      });

      // Parse AI response
      const analysis = this.parseAIResponse(response.content);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `AI analysis completed in ${processingTime}ms - Found ${analysis.risks.length} risks`,
      );

      return {
        ...analysis,
        metadata: {
          processingTime,
          tokensUsed: response.tokensUsed,
          model: response.model,
          analyzedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`AI analysis failed: ${error.message}`, error.stack);
      throw error; // Let service layer handle fallback
    }
  }

  /**
   * Get RAG context for historical insights
   */
  private async getRAGContext(context: SprintAnalysisContext): Promise<any[]> {
    try {
      const totalPoints = context.issues.reduce((sum, i) => sum + (i.point || 0), 0);
      const queryText = `Sprint planning with ${totalPoints} story points, ${context.issues.length} tasks in sprint. Project: ${context.sprint.name}`;

      const similarIssues = await this.ragService.findSimilarIssues({
        query: queryText,
        limit: 5,
        projectId: context.sprint.projectId,
        threshold: 0.75,
      });

      this.logger.log(`Found ${similarIssues.length} similar issues for RAG context`);
      return similarIssues;
    } catch (error) {
      this.logger.warn(`RAG search failed: ${error.message}`);
      return []; // Continue without RAG context
    }
  }

  /**
   * Get system prompt that defines AI's role and behavior
   */
  private getSystemPrompt(): string {
    return `You are an expert Agile Coach and Sprint Risk Analyst with 10+ years of experience managing software development teams.

Your role is to analyze sprint data and provide:
1. **Risk Detection**: Identify ALL potential issues that could impact sprint success
2. **Risk Assessment**: Evaluate severity and impact of each risk
3. **Actionable Recommendations**: Provide specific, practical actions the team can take
4. **Context-Aware Insights**: Consider team history, velocity trends, and patterns

Analysis Principles:
- Focus on ACTIONABLE insights, not generic advice
- Consider the team's context and history
- Prioritize risks by impact and urgency
- Provide specific recommendations with effort estimates
- Use Vietnamese language for all descriptions
- Be realistic and practical, not overly alarmist

Risk Categories to Analyze:
1. **OVERCOMMITMENT**: Committed points > velocity * 1.1 (110% threshold)
2. **BLOCKED_ISSUES**: >20% of issues are blocked
3. **ZERO_PROGRESS**: Issues not updated in 3+ days
4. **MISSING_ESTIMATES**: >20% of issues without story points
5. **WORKLOAD_IMBALANCE**: Any team member has >50% of total points

Output Format:
Return a JSON object with this EXACT structure (no markdown, no explanation):
{
  "overallHealthScore": <0-100>,
  "healthGrade": "A" | "B" | "C" | "D" | "F",
  "healthStatus": "HEALTHY" | "AT_RISK" | "CRITICAL",
  "summary": "<Brief Vietnamese summary of sprint health>",
  "risks": [
    {
      "type": "<OVERCOMMITMENT|BLOCKED_ISSUES|ZERO_PROGRESS|MISSING_ESTIMATES|WORKLOAD_IMBALANCE>",
      "severity": "CRITICAL" | "MEDIUM" | "LOW",
      "title": "<Vietnamese title>",
      "description": "<Vietnamese detailed description>",
      "impactScore": <1-10>,
      "confidence": <0-1>,
      "affectedIssues": ["<issue-id>"],
      "recommendations": [
        {
          "priority": <1-3>,
          "action": "<Vietnamese specific action>",
          "expectedImpact": "<Vietnamese impact description>",
          "effortEstimate": "<time estimate>",
          "suggestedIssues": ["<issue-id>"]
        }
      ]
    }
  ],
  "insights": [
    {
      "type": "POSITIVE" | "CONCERN" | "TREND",
      "message": "<Vietnamese insight>"
    }
  ]
}`;
  }

  /**
   * Build comprehensive analysis prompt with sprint context
   */
  private buildAnalysisPrompt(context: SprintAnalysisContext, ragContext: any[]): string {
    const {
      sprint,
      issues,
      sprintHistory,
      teamMembers,
    } = context;

    // Calculate basic metrics
    const totalIssues = issues.length;
    const committedPoints = issues.reduce((sum, i) => sum + (i.point || 0), 0);
    const completedIssues = issues.filter((i) =>
      i.statusName?.toLowerCase().includes('done') ||
      i.statusName?.toLowerCase().includes('completed')
    ).length;
    const blockedIssues = issues.filter((i) =>
      i.statusName?.toLowerCase().includes('blocked')
    ).length;
    const inProgressIssues = issues.filter((i) =>
      i.statusName?.toLowerCase().includes('progress')
    ).length;
    const missingEstimates = issues.filter((i) => !i.point || i.point === 0).length;

    // Calculate workload distribution
    const workloadMap = new Map<string, number>();
    issues.forEach((issue) => {
      if (issue.point && issue.assignees && issue.assignees.length > 0) {
        const pointsPerAssignee = issue.point / issue.assignees.length;
        issue.assignees.forEach((memberId) => {
          workloadMap.set(memberId, (workloadMap.get(memberId) || 0) + pointsPerAssignee);
        });
      }
    });

    const workloadDistribution = Array.from(workloadMap.entries())
      .map(([memberId, points]) => ({
        memberId,
        points: Math.round(points * 10) / 10,
        percentage: committedPoints > 0 ? Math.round((points / committedPoints) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.points - a.points);

    // Calculate average velocity
    const avgVelocity =
      sprintHistory.length > 0
        ? sprintHistory.slice(-3).reduce((sum, s) => sum + s.velocity, 0) / Math.min(3, sprintHistory.length)
        : committedPoints * 0.8; // Estimate if no history

    // Calculate sprint progress
    const sprintStart = new Date(sprint.startDate);
    const sprintEnd = new Date(sprint.endDate);
    const now = new Date();
    const totalDuration = sprintEnd.getTime() - sprintStart.getTime();
    const elapsed = now.getTime() - sprintStart.getTime();
    const progressPercentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

    // Build issues summary
    const issuesSummary = issues.slice(0, 15).map((issue) => ({
      id: issue.id,
      name: issue.name,
      type: issue.type,
      priority: issue.priority,
      status: issue.statusName || 'Unknown',
      points: issue.point,
      assignees: issue.assignees?.length || 0,
      age: issue.createdAt ? Math.floor((now.getTime() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      lastUpdated: issue.updatedAt ? Math.floor((now.getTime() - new Date(issue.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    }));

    // Build historical context
    const historySummary = sprintHistory.slice(-3).map((s) => ({
      name: s.sprintName,
      velocity: s.velocity,
      completionRate: s.completionRate,
    }));

    return `Analyze this sprint and identify ALL potential risks with specific, actionable recommendations.

## Sprint Information
- **Name**: ${sprint.name}
- **Status**: ${sprint.status}
- **Duration**: ${sprint.startDate} to ${sprint.endDate}
- **Progress**: ${progressPercentage.toFixed(0)}% elapsed

## Current Metrics
- **Total Issues**: ${totalIssues}
- **Committed Points**: ${committedPoints}
- **Average Velocity**: ${avgVelocity.toFixed(1)} points (from last 3 sprints)
- **Commitment Ratio**: ${avgVelocity > 0 ? ((committedPoints / avgVelocity) * 100).toFixed(0) : 'N/A'}%

## Issue Breakdown
- ✅ Completed: ${completedIssues}/${totalIssues} (${totalIssues > 0 ? ((completedIssues / totalIssues) * 100).toFixed(0) : 0}%)
- 🔄 In Progress: ${inProgressIssues}
- 🚫 Blocked: ${blockedIssues}
- ❓ Missing Estimates: ${missingEstimates}/${totalIssues} (${totalIssues > 0 ? ((missingEstimates / totalIssues) * 100).toFixed(0) : 0}%)

## Workload Distribution
${workloadDistribution.length > 0 ? workloadDistribution.map((w, idx) => `${idx + 1}. Member ${w.memberId.substring(0, 8)}: ${w.points} points (${w.percentage}%)`).join('\n') : 'No workload data'}

## Historical Performance (Last 3 Sprints)
${historySummary.length > 0 ? historySummary.map((h, idx) => `${idx + 1}. ${h.name}: ${h.velocity} velocity, ${h.completionRate}% completion`).join('\n') : 'No historical data'}

## Issues Details (First 15)
${issuesSummary.map((i, idx) => `${idx + 1}. [${i.priority}/${i.status}] ${i.name}
   - UUID: ${i.id}
   - Type: ${i.type}, Points: ${i.points || 'N/A'}, Assignees: ${i.assignees}
   - Age: ${i.age} days, Last updated: ${i.lastUpdated} days ago`).join('\n')}
${totalIssues > 15 ? `\n... and ${totalIssues - 15} more issues` : ''}

## Team Context
- **Team Size**: ${teamMembers?.length || workloadDistribution.length || 'Unknown'}
- **Active Members**: ${workloadDistribution.length}

## Historical Context (RAG - Similar Past Issues)
${ragContext.length > 0 ? ragContext.map((i, idx) => `${idx + 1}. [${i.type}/${i.priority}] ${i.name} - ${i.point || 'N/A'} points (Similarity: ${(i.similarity * 100).toFixed(1)}%)`).join('\n') : 'No similar past issues found'}

---

Based on this data, analyze:
1. Is the team overcommitted? (Committed points vs velocity)
2. Are there blocking issues or bottlenecks?
3. Is workload distributed fairly? (No one should exceed 50%)
4. Are there stale issues? (Not updated in 3+ days)
5. Is the team on track? (Progress vs time elapsed)
6. Any concerning patterns or trends?

Provide SPECIFIC recommendations with:
- Exact issue UUIDs to act on (use the full UUID from the "Issues Details" section above, e.g., "abc123-def456-...")
- Concrete actions (not generic advice)
- Realistic effort estimates
- Expected impact

CRITICAL RULES:
1. For "affectedIssues" and "suggestedIssues" arrays, ONLY use the FULL UUID from the issue list above
2. DO NOT use issue numbers (1, 2, 3) or shortened IDs
3. Example CORRECT: "affectedIssues": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
4. Example WRONG: "affectedIssues": ["1"] or "affectedIssues": ["a1b2c3d4"]
5. If you cannot find a specific issue UUID, use an empty array [] instead

IMPORTANT: Return ONLY valid JSON, no markdown formatting.`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(content: string): AIRiskAnalysisResult {
    try {
      // Remove markdown code blocks if present
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '').trim();
      }

      const parsed = JSON.parse(cleanedContent);

      // Validate required fields
      if (!parsed.overallHealthScore || !parsed.risks || !Array.isArray(parsed.risks)) {
        throw new Error('Invalid AI response structure');
      }

      return parsed;
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      throw error;
    }
  }
}

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SprintAnalysisContext {
  sprint: {
    id: string;
    projectId: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  issues: Array<{
    id: string;
    name: string;
    type: string;
    priority: string;
    statusName?: string; // Human-readable status name
    point: number | null;
    assignees: string[];
    createdAt?: string;
    updatedAt?: string;
  }>;
  sprintHistory: Array<{
    sprintName: string;
    velocity: number;
    completionRate: number;
  }>;
  teamMembers?: Array<{
    id: string;
    name: string;
  }>;
}

export interface AIRiskAnalysisResult {
  overallHealthScore: number; // 0-100
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  healthStatus: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  summary: string;
  risks: AIDetectedRisk[];
  insights: AIInsight[];
  metadata?: {
    processingTime: number;
    tokensUsed: number;
    model: string;
    analyzedAt: string;
  };
}

export interface AIDetectedRisk {
  type: string;
  severity: 'CRITICAL' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impactScore: number; // 1-10
  confidence: number; // 0-1
  affectedIssues: string[];
  recommendations: AIRecommendation[];
}

export interface AIRecommendation {
  priority: number; // 1-3
  action: string;
  expectedImpact: string;
  effortEstimate: string;
  suggestedIssues: string[];
}

export interface AIInsight {
  type: 'POSITIVE' | 'CONCERN' | 'TREND';
  message: string;
}
