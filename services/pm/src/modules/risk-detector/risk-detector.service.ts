import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { SimilarIssueDto } from '../rag/dto/rag.dto';
import { AIRiskAnalyzerService, AIRiskAnalysisResult, SprintAnalysisContext } from './ai-risk-analyzer.service';
import { OvercommitmentRule, BlockedIssuesRule } from './rules';
import {
  IRiskRule,
  SprintContext,
  SprintData,
  IssueData,
  SprintHistoryData,
  RiskResult,
} from './interfaces/risk-rule.interface';
import {
  RiskAlertDto,
  RiskSummaryDto,
  RiskSeverity,
  RiskAlertStatus,
  GetSprintRisksQueryDto,
  DetectRisksResponseDto,
} from './dto';

@Injectable()
export class RiskDetectorService {
  private readonly logger = new Logger(RiskDetectorService.name);
  private readonly rules: IRiskRule[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
    private readonly aiRiskAnalyzer: AIRiskAnalyzerService, // AI-primary engine
    // Keep rules for fallback
    private readonly overcommitmentRule: OvercommitmentRule,
    private readonly blockedIssuesRule: BlockedIssuesRule,
  ) {
    // Register all risk detection rules (for fallback)
    this.rules = [
      this.overcommitmentRule,
      this.blockedIssuesRule,
    ];

    this.logger.log(`Initialized with AI-primary risk detection + ${this.rules.length} fallback rules`);
  }

  /**
   * Detect all risks for a sprint using AI-primary approach
   */
  async detectRisksForSprint(sprintId: string): Promise<DetectRisksResponseDto> {
    this.logger.log(`Detecting risks for sprint ${sprintId} (AI-primary approach)`);

    const startTime = Date.now();

    // Step 1: Build sprint context with RAG
    const context = await this.buildSprintContext(sprintId);
    if (!context) {
      throw new NotFoundException(`Sprint ${sprintId} not found`);
    }

    // Build analysis context for AI
    const analysisContext = await this.buildAnalysisContext(context);

    // Step 2: Try AI analysis FIRST (PRIMARY)
    let aiResult: AIRiskAnalysisResult | null = null;
    try {
      aiResult = await this.aiRiskAnalyzer.analyzeSprintRisks(analysisContext);
      this.logger.log(`AI analysis successful - Found ${aiResult.risks.length} risks`);
    } catch (error) {
      this.logger.warn(`AI analysis failed: ${error.message}, falling back to rules`);
    }

    // Step 3: If AI succeeded, use AI results
    if (aiResult) {
      const savedRisks = await this.saveAIRisks(sprintId, aiResult, context);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        detectedRisks: savedRisks.length,
        risks: savedRisks,
        totalChecked: 5, // All 5 risk types checked by AI
        message: 'AI analysis completed successfully',
        overallHealthScore: aiResult.overallHealthScore,
        healthGrade: aiResult.healthGrade,
        healthStatus: aiResult.healthStatus,
        summary: aiResult.summary,
        insights: aiResult.insights,
        analysis: this.buildAnalysisMetadata(context, aiResult, processingTime),
      };
    }

    // Step 4: FALLBACK - Use rule-based detection
    this.logger.warn('Using rule-based fallback detection');
    const ruleBasedRisks = await this.runRuleBasedDetection(context);
    const savedRisks = await this.saveRuleRisks(ruleBasedRisks, context);

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      detectedRisks: savedRisks.length,
      risks: savedRisks,
      totalChecked: this.rules.length,
      message: 'Rule-based detection (AI unavailable)',
      analysis: this.buildBasicAnalysisMetadata(context, processingTime),
    };
  }

  /**
   * Get all risks for a sprint with optional filtering
   */
  async getSprintRisks(
    sprintId: string,
    query: GetSprintRisksQueryDto = {},
  ): Promise<{ risks: RiskAlertDto[]; summary: RiskSummaryDto }> {
    const { severity, status, includeRecommendations = true } = query;

    const where: any = { sprintId };

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    } else {
      // Default: only return active and acknowledged risks
      where.status = { in: ['ACTIVE', 'ACKNOWLEDGED'] };
    }

    const risks = await this.prisma.riskAlert.findMany({
      where,
      include: {
        recommendations: includeRecommendations
          ? { orderBy: { priority: 'asc' } }
          : false,
      },
      orderBy: [{ severity: 'desc' }, { detectedAt: 'desc' }],
    });

    // Calculate summary
    const summary = this.calculateRiskSummary(risks);

    // Map risks to DTOs (async now because we fetch issue details)
    const mappedRisks = await Promise.all(
      risks.map((r) => this.mapRiskAlertToDto(r))
    );

    return {
      risks: mappedRisks,
      summary,
    };
  }

  /**
   * Acknowledge a risk alert
   */
  async acknowledgeRisk(
    riskId: string,
    userId: string,
    note?: string,
  ): Promise<RiskAlertDto> {
    const risk = await this.prisma.riskAlert.findUnique({
      where: { id: riskId },
    });

    if (!risk) {
      throw new NotFoundException(`Risk ${riskId} not found`);
    }

    const updated = await this.prisma.riskAlert.update({
      where: { id: riskId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        // Optionally store note in metadata
        ...(note && {
          metadata: {
            ...(risk.metadata as any),
            acknowledgeNote: note,
          },
        }),
      },
      include: {
        recommendations: {
          orderBy: { priority: 'asc' },
        },
      },
    });

    this.logger.log(`Risk ${riskId} acknowledged by user ${userId}`);

    return await this.mapRiskAlertToDto(updated);
  }

  /**
   * Resolve a risk alert
   */
  async resolveRisk(
    riskId: string,
    resolution: string,
    actionsTaken?: string[],
  ): Promise<RiskAlertDto> {
    const risk = await this.prisma.riskAlert.findUnique({
      where: { id: riskId },
    });

    if (!risk) {
      throw new NotFoundException(`Risk ${riskId} not found`);
    }

    const updated = await this.prisma.riskAlert.update({
      where: { id: riskId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        metadata: {
          ...(risk.metadata as any),
          resolution,
          actionsTaken,
        },
      },
      include: {
        recommendations: {
          orderBy: { priority: 'asc' },
        },
      },
    });

    this.logger.log(`Risk ${riskId} resolved`);

    return await this.mapRiskAlertToDto(updated);
  }

  /**
   * Dismiss a risk alert (false positive or not actionable)
   */
  async dismissRisk(riskId: string, reason: string): Promise<RiskAlertDto> {
    const risk = await this.prisma.riskAlert.findUnique({
      where: { id: riskId },
    });

    if (!risk) {
      throw new NotFoundException(`Risk ${riskId} not found`);
    }

    const updated = await this.prisma.riskAlert.update({
      where: { id: riskId },
      data: {
        status: 'DISMISSED',
        metadata: {
          ...(risk.metadata as any),
          dismissReason: reason,
        },
      },
      include: {
        recommendations: {
          orderBy: { priority: 'asc' },
        },
      },
    });

    this.logger.log(`Risk ${riskId} dismissed: ${reason}`);

    return await this.mapRiskAlertToDto(updated);
  }

  /**
   * Apply a recommendation (auto-execute suggested actions)
   */
  async applyRecommendation(
    recommendationId: string,
    note?: string,
  ): Promise<{ issuesMoved: number; movedIssueIds: string[] }> {
    // Find the recommendation
    const recommendation = await this.prisma.riskRecommendation.findUnique({
      where: { id: recommendationId },
      include: {
        alert: true,
      },
    });

    if (!recommendation) {
      throw new NotFoundException(
        `Recommendation ${recommendationId} not found`,
      );
    }

    // Get suggested issues from the recommendation
    const suggestedIssues = Array.isArray(recommendation.suggestedIssues)
      ? (recommendation.suggestedIssues as string[])
      : [];

    if (suggestedIssues.length === 0) {
      this.logger.warn(
        `Recommendation ${recommendationId} has no suggested issues to move`,
      );
      return { issuesMoved: 0, movedIssueIds: [] };
    }

    // Move suggested issues to backlog (set sprintId to null)
    const movedIssueIds: string[] = [];

    try {
      for (const issueId of suggestedIssues) {
        // Validate that issueId is a string
        if (typeof issueId !== 'string') {
          this.logger.warn(`Invalid issue ID type: ${issueId}`);
          continue;
        }

        // Validate UUID format (36 characters with dashes)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(issueId)) {
          this.logger.warn(`Invalid UUID format for issue ID: ${issueId}`);
          continue;
        }

        const issue = await this.prisma.issue.findUnique({
          where: { id: issueId },
        });

        if (issue && issue.sprintId) {
          await this.prisma.issue.update({
            where: { id: issueId },
            data: { sprintId: null },
          });

          movedIssueIds.push(issueId);
          this.logger.log(`Moved issue ${issueId} to backlog`);
        }
      }

      // Mark recommendation as APPLIED
      await this.prisma.riskRecommendation.update({
        where: { id: recommendationId },
        data: {
          status: 'APPLIED',
          appliedAt: new Date(),
        },
      });

      this.logger.log(
        `Recommendation ${recommendationId} applied - Moved ${movedIssueIds.length} issues to backlog`,
      );

      return {
        issuesMoved: movedIssueIds.length,
        movedIssueIds,
      };
    } catch (error) {
      this.logger.error(
        `Error applying recommendation ${recommendationId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to apply recommendation. Please try again.',
      );
    }
  }

  /**
   * Build sprint context for risk detection
   */
  private async buildSprintContext(
    sprintId: string,
  ): Promise<SprintContext | null> {
    // Fetch sprint
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      return null;
    }

    // Fetch issues in sprint with status info
    const issues = await this.prisma.issue.findMany({
      where: { sprintId },
      include: {
        status: true,
      },
    });

    // Fetch sprint history for velocity calculation
    const sprintHistory = await this.prisma.sprintHistory.findMany({
      where: { projectId: sprint.projectId },
      orderBy: { startDate: 'desc' },
      take: 6, // Last 6 sprints for trend analysis
    });

    // RAG: Find similar past issues for AI context
    let similarPastIssues: SimilarIssueDto[] = [];
    try {
      const totalPoints = issues.reduce((sum, i) => sum + (Number(i.point) || 0), 0);
      const queryText = `Sprint planning with ${totalPoints} story points, ${issues.length} tasks in sprint. Project: ${sprint.name}`;

      similarPastIssues = await this.ragService.findSimilarIssues({
        query: queryText,
        limit: 10,
        projectId: sprint.projectId,
        threshold: 0.75,
      });

      this.logger.log(`Found ${similarPastIssues.length} similar issues for context`);
    } catch (error) {
      this.logger.warn(`RAG search failed: ${error.message}`);
      // Continue without RAG context
    }

    // Map to interface types
    const context: SprintContext = {
      sprint: this.mapSprintToData(sprint),
      issues: issues.map((i) => this.mapIssueToData(i)),
      sprintHistory: sprintHistory.map((h) => this.mapHistoryToData(h)),
      similarPastIssues, // RAG context
      // TODO: Get team capacity from project settings
      teamCapacity: undefined,
    };

    return context;
  }

  /**
   * Map Prisma models to interface types
   */
  private mapSprintToData(sprint: any): SprintData {
    return {
      id: sprint.id,
      projectId: sprint.projectId,
      name: sprint.name,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      initialStoryPoints: sprint.initialStoryPoints
        ? Number(sprint.initialStoryPoints)
        : null,
      velocity: sprint.velocity ? Number(sprint.velocity) : null,
    };
  }

  private mapIssueToData(issue: any): IssueData {
    return {
      id: issue.id,
      projectId: issue.projectId,
      sprintId: issue.sprintId,
      parentId: issue.parentId,
      name: issue.name,
      type: issue.type,
      priority: issue.priority,
      point: issue.point ? Number(issue.point) : null,
      state: issue.status?.name || 'UNKNOWN',
      statusId: issue.statusId,
      assignees: Array.isArray(issue.assigneesJson)
        ? issue.assigneesJson
        : [],
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  }

  private mapHistoryToData(history: any): SprintHistoryData {
    return {
      id: history.id,
      sprintId: history.sprintId,
      committedPoints: history.committedPoints,
      completedPoints: history.completedPoints,
      velocity: history.velocity,
      startDate: history.startDate,
      endDate: history.endDate,
    };
  }

  private async mapRiskAlertToDto(alert: any): Promise<RiskAlertDto> {
    // Fetch issue details for recommendations if they have suggestedIssues
    const recommendations = alert.recommendations
      ? await Promise.all(
          alert.recommendations.map(async (rec: any) => {
            const suggestedIssues = Array.isArray(rec.suggestedIssues)
              ? rec.suggestedIssues
              : [];

            // Fetch issue details for valid UUIDs
            let suggestedIssuesDetails: Array<{ id: string; name: string; type: string }> = [];
            if (suggestedIssues.length > 0) {
              const validIssueIds = this.validateUUIDs(suggestedIssues);
              if (validIssueIds.length > 0) {
                try {
                  const issues = await this.prisma.issue.findMany({
                    where: { id: { in: validIssueIds } },
                    select: { id: true, name: true, type: true },
                  });
                  suggestedIssuesDetails = issues;
                } catch (error) {
                  this.logger.warn(`Failed to fetch issue details: ${error.message}`);
                }
              }
            }

            return {
              id: rec.id,
              priority: rec.priority,
              action: rec.action,
              expectedImpact: rec.expectedImpact,
              effortEstimate: rec.effortEstimate,
              suggestedIssues,
              suggestedIssuesDetails,
              status: rec.status,
              appliedAt: rec.appliedAt?.toISOString(),
            };
          })
        )
      : undefined;

    return {
      id: alert.id,
      sprintId: alert.sprintId,
      projectId: alert.projectId,
      riskType: alert.riskType,
      severity: alert.severity as RiskSeverity,
      title: alert.title,
      description: alert.description,
      impactScore: alert.impactScore,
      status: alert.status as RiskAlertStatus,
      affectedIssues: Array.isArray(alert.affectedIssues)
        ? alert.affectedIssues
        : [],
      metadata: alert.metadata as any,
      detectedAt: alert.detectedAt.toISOString(),
      recommendations,
    };
  }

  private calculateRiskSummary(risks: any[]): RiskSummaryDto {
    return {
      total: risks.length,
      critical: risks.filter((r) => r.severity === 'CRITICAL').length,
      medium: risks.filter((r) => r.severity === 'MEDIUM').length,
      low: risks.filter((r) => r.severity === 'LOW').length,
    };
  }

  /**
   * Build analysis context for AI service
   */
  private async buildAnalysisContext(context: SprintContext): Promise<SprintAnalysisContext> {
    const { sprint, issues, sprintHistory } = context;

    // Map sprint history to simpler format
    const historyData = sprintHistory.map((h) => ({
      sprintName: `Sprint ${h.id.substring(0, 8)}`,
      velocity: h.velocity,
      completionRate: h.completedPoints > 0
        ? Math.round((h.completedPoints / h.committedPoints) * 100)
        : 0,
    }));

    // Map issues to simpler format for AI
    const issuesData = issues.map((i) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      priority: i.priority,
      statusName: i.state,
      point: i.point,
      assignees: i.assignees,
      createdAt: i.createdAt?.toISOString(),
      updatedAt: i.updatedAt?.toISOString(),
    }));

    return {
      sprint: {
        id: sprint.id,
        projectId: sprint.projectId,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate?.toISOString() || new Date().toISOString(),
        endDate: sprint.endDate?.toISOString() || new Date().toISOString(),
      },
      issues: issuesData,
      sprintHistory: historyData,
      teamMembers: [], // TODO: Get from project members
    };
  }

  /**
   * Validate and filter valid UUIDs from array
   */
  private validateUUIDs(ids: string[]): string[] {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return ids.filter((id) => {
      if (typeof id !== 'string' || !uuidRegex.test(id)) {
        this.logger.warn(`Filtered out invalid UUID: ${id}`);
        return false;
      }
      return true;
    });
  }

  /**
   * Save AI-detected risks to database
   */
  private async saveAIRisks(
    sprintId: string,
    aiResult: AIRiskAnalysisResult,
    context: SprintContext,
  ): Promise<RiskAlertDto[]> {
    const savedRisks: RiskAlertDto[] = [];

    for (const aiRisk of aiResult.risks) {
      try {
        // Check if this risk already exists
        const existingRisk = await this.prisma.riskAlert.findFirst({
          where: {
            sprintId,
            riskType: aiRisk.type,
            status: { in: ['ACTIVE', 'ACKNOWLEDGED'] },
          },
        });

        if (!existingRisk) {
          // Create new risk alert (validate UUIDs first)
          const savedRisk = await this.prisma.riskAlert.create({
            data: {
              sprintId,
              projectId: context.sprint.projectId,
              riskType: aiRisk.type,
              severity: aiRisk.severity as RiskSeverity,
              title: aiRisk.title,
              description: aiRisk.description,
              impactScore: aiRisk.impactScore,
              affectedIssues: this.validateUUIDs(aiRisk.affectedIssues || []),
              metadata: {
                confidence: aiRisk.confidence,
                aiGenerated: true,
                tokensUsed: aiResult.metadata?.tokensUsed,
                model: aiResult.metadata?.model,
              },
            },
          });

          // Save recommendations (validate UUIDs first)
          if (aiRisk.recommendations && aiRisk.recommendations.length > 0) {
            await this.prisma.riskRecommendation.createMany({
              data: aiRisk.recommendations.map((rec) => ({
                alertId: savedRisk.id,
                priority: rec.priority,
                action: rec.action,
                expectedImpact: rec.expectedImpact,
                effortEstimate: rec.effortEstimate,
                suggestedIssues: this.validateUUIDs(rec.suggestedIssues || []),
              })),
            });
          }

          // Fetch with recommendations
          const riskWithRecommendations = await this.prisma.riskAlert.findUnique({
            where: { id: savedRisk.id },
            include: {
              recommendations: { orderBy: { priority: 'asc' } },
            },
          });

          savedRisks.push(await this.mapRiskAlertToDto(riskWithRecommendations!));
          this.logger.log(`Saved AI risk: ${aiRisk.type} (${aiRisk.severity})`);
        }
      } catch (error) {
        this.logger.error(`Failed to save AI risk ${aiRisk.type}: ${error.message}`);
      }
    }

    return savedRisks;
  }

  /**
   * Run rule-based detection (fallback)
   */
  private async runRuleBasedDetection(context: SprintContext): Promise<RiskResult[]> {
    const results: RiskResult[] = [];

    for (const rule of this.rules) {
      try {
        const result = await rule.check(context);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        this.logger.error(`Error running rule ${rule.id}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Save rule-detected risks to database
   */
  private async saveRuleRisks(
    ruleResults: RiskResult[],
    context: SprintContext,
  ): Promise<RiskAlertDto[]> {
    const savedRisks: RiskAlertDto[] = [];

    for (const result of ruleResults) {
      try {
        // Check if this risk already exists
        const existingRisk = await this.prisma.riskAlert.findFirst({
          where: {
            sprintId: context.sprint.id,
            riskType: result.type,
            status: { in: ['ACTIVE', 'ACKNOWLEDGED'] },
          },
        });

        if (!existingRisk) {
          const savedRisk = await this.prisma.riskAlert.create({
            data: {
              sprintId: context.sprint.id,
              projectId: context.sprint.projectId,
              riskType: result.type,
              severity: result.severity,
              title: result.title,
              description: result.description,
              impactScore: result.impactScore,
              affectedIssues: result.affectedIssues || [],
              metadata: result.metadata || {},
            },
          });

          // Save recommendations
          if (result.recommendations && result.recommendations.length > 0) {
            await this.prisma.riskRecommendation.createMany({
              data: result.recommendations.map((rec) => ({
                alertId: savedRisk.id,
                priority: rec.priority,
                action: rec.action,
                expectedImpact: rec.expectedImpact,
                effortEstimate: rec.effortEstimate,
                suggestedIssues: rec.suggestedIssues || [],
              })),
            });
          }

          const riskWithRecommendations = await this.prisma.riskAlert.findUnique({
            where: { id: savedRisk.id },
            include: {
              recommendations: { orderBy: { priority: 'asc' } },
            },
          });

          savedRisks.push(await this.mapRiskAlertToDto(riskWithRecommendations!));
        }
      } catch (error) {
        this.logger.error(`Failed to save rule risk ${result.type}: ${error.message}`);
      }
    }

    return savedRisks;
  }

  /**
   * Calculate workload distribution
   */
  private calculateWorkloadDistribution(context: SprintContext): Array<{
    memberId: string;
    points: number;
    percentage: number;
  }> {
    const { issues } = context;
    const totalPoints = issues.reduce((sum, i) => sum + (i.point || 0), 0);

    const workloadMap = new Map<string, number>();

    issues.forEach((issue) => {
      if (issue.point && issue.assignees.length > 0) {
        const pointsPerAssignee = issue.point / issue.assignees.length;
        issue.assignees.forEach((userId) => {
          workloadMap.set(userId, (workloadMap.get(userId) || 0) + pointsPerAssignee);
        });
      }
    });

    return Array.from(workloadMap.entries())
      .map(([memberId, points]) => ({
        memberId,
        points: Math.round(points * 10) / 10,
        percentage: totalPoints > 0 ? Math.round((points / totalPoints) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.points - a.points);
  }

  /**
   * Build analysis metadata with AI fields
   */
  private buildAnalysisMetadata(
    context: SprintContext,
    aiResult: AIRiskAnalysisResult,
    processingTime: number,
  ): any {
    const { issues, sprintHistory } = context;

    const totalPoints = issues.reduce((sum, i) => sum + (i.point || 0), 0);
    const avgVelocity =
      sprintHistory.length > 0
        ? sprintHistory.slice(-3).reduce((sum, s) => sum + s.velocity, 0) /
          Math.min(3, sprintHistory.length)
        : 0;

    const blockedCount = issues.filter((i) =>
      i.state?.toLowerCase().includes('blocked')
    ).length;
    const missingEstimates = issues.filter((i) => !i.point || i.point === 0).length;

    const capacityStatus: 'UNDER' | 'OPTIMAL' | 'OVER' =
      avgVelocity === 0
        ? 'OPTIMAL'
        : totalPoints < avgVelocity * 0.9
          ? 'UNDER'
          : totalPoints > avgVelocity * 1.1
            ? 'OVER'
            : 'OPTIMAL';

    return {
      avgVelocity: Math.round(avgVelocity * 10) / 10,
      committedPoints: totalPoints,
      capacityStatus,
      blockedIssuesCount: blockedCount,
      totalIssuesCount: issues.length,
      workloadDistribution: this.calculateWorkloadDistribution(context),
      missingEstimatesCount: missingEstimates,
      processingTime,
      tokensUsed: aiResult.metadata?.tokensUsed,
      aiModel: aiResult.metadata?.model,
    };
  }

  /**
   * Build basic analysis metadata (no AI fields)
   */
  private buildBasicAnalysisMetadata(
    context: SprintContext,
    processingTime: number,
  ): any {
    const { issues, sprintHistory } = context;

    const totalPoints = issues.reduce((sum, i) => sum + (i.point || 0), 0);
    const avgVelocity =
      sprintHistory.length > 0
        ? sprintHistory.slice(-3).reduce((sum, s) => sum + s.velocity, 0) /
          Math.min(3, sprintHistory.length)
        : 0;

    const blockedCount = issues.filter((i) =>
      i.state?.toLowerCase().includes('blocked')
    ).length;
    const missingEstimates = issues.filter((i) => !i.point || i.point === 0).length;

    const capacityStatus: 'UNDER' | 'OPTIMAL' | 'OVER' =
      avgVelocity === 0
        ? 'OPTIMAL'
        : totalPoints < avgVelocity * 0.9
          ? 'UNDER'
          : totalPoints > avgVelocity * 1.1
            ? 'OVER'
            : 'OPTIMAL';

    return {
      avgVelocity: Math.round(avgVelocity * 10) / 10,
      committedPoints: totalPoints,
      capacityStatus,
      blockedIssuesCount: blockedCount,
      totalIssuesCount: issues.length,
      workloadDistribution: this.calculateWorkloadDistribution(context),
      missingEstimatesCount: missingEstimates,
      processingTime,
    };
  }
}
