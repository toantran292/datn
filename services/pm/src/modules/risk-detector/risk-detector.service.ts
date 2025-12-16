import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { SimilarIssueDto } from '../rag/dto/rag.dto';
import { OvercommitmentRule, BlockedIssuesRule } from './rules';
import {
  IRiskRule,
  SprintContext,
  SprintData,
  IssueData,
  SprintHistoryData,
} from './interfaces/risk-rule.interface';
import {
  RiskAlertDto,
  RiskSummaryDto,
  RiskSeverity,
  RiskAlertStatus,
  GetSprintRisksQueryDto,
} from './dto';

@Injectable()
export class RiskDetectorService {
  private readonly logger = new Logger(RiskDetectorService.name);
  private readonly rules: IRiskRule[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
    private readonly overcommitmentRule: OvercommitmentRule,
    private readonly blockedIssuesRule: BlockedIssuesRule,
    // TODO: Inject other rules when implemented
  ) {
    // Register all risk detection rules
    this.rules = [
      this.overcommitmentRule,
      this.blockedIssuesRule,
      // TODO: Add other rules
    ];

    this.logger.log(`Initialized with ${this.rules.length} risk detection rules`);
  }

  /**
   * Detect all risks for a sprint
   */
  async detectRisksForSprint(sprintId: string): Promise<RiskAlertDto[]> {
    this.logger.log(`Detecting risks for sprint ${sprintId}`);

    // Build sprint context
    const context = await this.buildSprintContext(sprintId);

    if (!context) {
      throw new NotFoundException(`Sprint ${sprintId} not found`);
    }

    // Run all rules
    const detectedRisks: RiskAlertDto[] = [];

    for (const rule of this.rules) {
      try {
        const result = await rule.check(context);

        if (result) {
          // Check if this risk already exists (avoid duplicates)
          const existingRisk = await this.prisma.riskAlert.findFirst({
            where: {
              sprintId,
              riskType: result.type,
              status: {
                in: ['ACTIVE', 'ACKNOWLEDGED'],
              },
            },
          });

          if (!existingRisk) {
            // Create new risk alert
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

            // Save recommendations if provided
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

            // Fetch with recommendations
            const riskWithRecommendations =
              await this.prisma.riskAlert.findUnique({
                where: { id: savedRisk.id },
                include: {
                  recommendations: {
                    orderBy: { priority: 'asc' },
                  },
                },
              });

            detectedRisks.push(
              this.mapRiskAlertToDto(riskWithRecommendations!),
            );

            this.logger.log(
              `New risk detected: ${result.type} (${result.severity})`,
            );
          } else {
            this.logger.debug(
              `Risk ${result.type} already exists for sprint ${sprintId}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Error running rule ${rule.id}: ${error.message}`,
          error.stack,
        );
      }
    }

    return detectedRisks;
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

    return {
      risks: risks.map((r) => this.mapRiskAlertToDto(r)),
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

    return this.mapRiskAlertToDto(updated);
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

    return this.mapRiskAlertToDto(updated);
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

    return this.mapRiskAlertToDto(updated);
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
          this.logger.warn(`Invalid issue ID: ${issueId}`);
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

  private mapRiskAlertToDto(alert: any): RiskAlertDto {
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
      recommendations: alert.recommendations?.map((rec: any) => ({
        id: rec.id,
        priority: rec.priority,
        action: rec.action,
        expectedImpact: rec.expectedImpact,
        effortEstimate: rec.effortEstimate,
        suggestedIssues: Array.isArray(rec.suggestedIssues)
          ? rec.suggestedIssues
          : [],
        status: rec.status,
        appliedAt: rec.appliedAt?.toISOString(),
      })),
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
}
