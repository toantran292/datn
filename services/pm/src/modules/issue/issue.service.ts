import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RagService } from "../rag/rag.service";
import { RagClient } from "../../common/rag/rag.client";
import { CreateIssueDto } from "./dto/create-issue.dto";
import { UpdateIssueDto } from "./dto/update-issue.dto";
import { ReorderIssueDto, ReorderPosition } from "./dto/reorder-issue.dto";
import { IssueResponseDto } from "./dto/issue-response.dto";
import { SearchIssuesDto, SearchIssuesResponseDto, SearchResultDto } from "./dto/search-issues.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class IssueService {
  private static readonly DEFAULT_SORT_INCREMENT = 1000;
  private static readonly MIN_SORT_GAP = 0.000001;
  private readonly logger = new Logger(IssueService.name);

  constructor(
    private prisma: PrismaService,
    private ragService: RagService,
    private ragClient: RagClient,
  ) {}

  async create(dto: CreateIssueDto, orgId: string, userId: string): Promise<IssueResponseDto> {
    // Validate project exists and belongs to organization
    const project = await this.prisma.project.findFirst({
      where: {
        id: dto.projectId,
        orgId,
      },
    });
    if (!project) {
      throw new NotFoundException(`Project not found in your organization: ${dto.projectId}`);
    }

    // Validate sprint if provided
    if (dto.sprintId) {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: dto.sprintId },
      });
      if (!sprint) {
        throw new NotFoundException(`Sprint not found: ${dto.sprintId}`);
      }
      if (sprint.projectId !== dto.projectId) {
        throw new BadRequestException("Sprint does not belong to project");
      }
    }

    // Validate parent if provided
    if (dto.parentId) {
      const parent = await this.prisma.issue.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent issue not found: ${dto.parentId}`);
      }
      if (parent.projectId !== dto.projectId) {
        throw new BadRequestException("Parent issue does not belong to project");
      }
    }

    // Get or validate status
    let statusId = dto.statusId;
    if (!statusId) {
      // If no statusId provided, get the first status (order = 0, usually "TO DO")
      const defaultStatus = await this.prisma.issueStatus.findFirst({
        where: {
          projectId: dto.projectId,
        },
        orderBy: {
          order: "asc",
        },
      });
      if (!defaultStatus) {
        throw new BadRequestException(`No status found for project: ${dto.projectId}`);
      }
      statusId = defaultStatus.id;
    } else {
      // Validate provided status exists and belongs to project
      const status = await this.prisma.issueStatus.findUnique({
        where: { id: statusId },
      });
      if (!status) {
        throw new NotFoundException(`Status not found: ${statusId}`);
      }
      if (status.projectId !== dto.projectId) {
        throw new BadRequestException("Status does not belong to project");
      }
    }

    // Get next sequence ID for this project
    const sequenceId = await this.getNextSequenceId(dto.projectId);

    // Calculate sortOrder if not provided
    let sortOrder = dto.sortOrder;
    if (!sortOrder) {
      const lastIssue = await this.getLastIssueInSprint(dto.projectId, dto.sprintId);
      sortOrder = lastIssue
        ? Number(lastIssue.sortOrder) + IssueService.DEFAULT_SORT_INCREMENT
        : IssueService.DEFAULT_SORT_INCREMENT;
    }

    // Default start and target dates to today if not provided
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    const issue = await this.prisma.issue.create({
      data: {
        projectId: dto.projectId,
        sprintId: dto.sprintId || null,
        parentId: dto.parentId || null,
        statusId: statusId,
        name: dto.name,
        description: dto.description || null,
        descriptionHtml: dto.descriptionHtml || null,
        priority: dto.priority,
        type: dto.type,
        point: dto.point ? new Prisma.Decimal(dto.point) : null,
        sequenceId,
        sortOrder: new Prisma.Decimal(sortOrder),
        startDate: dto.startDate ? new Date(dto.startDate) : today,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : today,
        assigneesJson: dto.assignees || [],
        createdBy: userId,
      },
      include: {
        status: true,
      },
    });

    // Index issue to RAG for semantic search (non-blocking)
    this.indexIssueToRAG(issue, project, orgId).catch((err: Error) => {
      this.logger.error(`Failed to index issue ${issue.id} to RAG: ${err.message}`);
    });

    return this.mapToResponse(issue);
  }

  async findById(id: string, orgId: string): Promise<IssueResponseDto> {
    const issue = await this.prisma.issue.findFirst({
      where: {
        id,
        project: {
          orgId,
        },
      },
      include: {
        status: true,
      },
    });
    if (!issue) {
      throw new NotFoundException(`Issue not found in your organization: ${id}`);
    }
    return this.mapToResponse(issue);
  }

  async findByProject(projectId: string, orgId: string): Promise<IssueResponseDto[]> {
    // Validate project belongs to organization
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        orgId,
      },
    });
    if (!project) {
      throw new NotFoundException(`Project not found in your organization: ${projectId}`);
    }

    const issues = await this.prisma.issue.findMany({
      where: { projectId },
      include: {
        status: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return issues.map((issue) => this.mapToResponse(issue));
  }

  async findBySprint(sprintId: string, orgId: string): Promise<IssueResponseDto[]> {
    // Validate sprint belongs to organization's project
    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id: sprintId,
        project: {
          orgId,
        },
      },
    });
    if (!sprint) {
      throw new NotFoundException(`Sprint not found in your organization: ${sprintId}`);
    }

    const issues = await this.prisma.issue.findMany({
      where: { sprintId },
      include: {
        status: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return issues.map((issue) => this.mapToResponse(issue));
  }

  async update(id: string, dto: UpdateIssueDto, orgId: string): Promise<IssueResponseDto> {
    const issue = await this.prisma.issue.findFirst({
      where: {
        id,
        project: {
          orgId,
        },
      },
    });
    if (!issue) {
      throw new NotFoundException(`Issue not found in your organization: ${id}`);
    }

    // Validate project if changed
    if (dto.projectId && dto.projectId !== issue.projectId) {
      const project = await this.prisma.project.findFirst({
        where: {
          id: dto.projectId,
          orgId,
        },
      });
      if (!project) {
        throw new NotFoundException(`Project not found in your organization: ${dto.projectId}`);
      }
    }

    // Validate sprint if provided
    if (dto.sprintId) {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: dto.sprintId },
      });
      if (!sprint) {
        throw new NotFoundException(`Sprint not found: ${dto.sprintId}`);
      }
      const targetProjectId = dto.projectId || issue.projectId;
      if (sprint.projectId !== targetProjectId) {
        throw new BadRequestException("Sprint does not belong to project");
      }
    }

    // Validate parent if provided
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException("Issue cannot be parent of itself");
      }
      const parent = await this.prisma.issue.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent issue not found: ${dto.parentId}`);
      }
      const targetProjectId = dto.projectId || issue.projectId;
      if (parent.projectId !== targetProjectId) {
        throw new BadRequestException("Parent issue does not belong to project");
      }
    }

    const updated = await this.prisma.issue.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        sprintId: dto.sprintId !== undefined ? dto.sprintId : issue.sprintId,
        parentId: dto.parentId !== undefined ? dto.parentId : issue.parentId,
        statusId: dto.statusId !== undefined ? dto.statusId : issue.statusId,
        name: dto.name,
        description: dto.description !== undefined ? dto.description : issue.description,
        descriptionHtml: dto.descriptionHtml !== undefined ? dto.descriptionHtml : issue.descriptionHtml,
        priority: dto.priority,
        type: dto.type,
        point: dto.point !== undefined ? (dto.point ? new Prisma.Decimal(dto.point) : null) : issue.point,
        sortOrder: dto.sortOrder !== undefined ? new Prisma.Decimal(dto.sortOrder) : issue.sortOrder,
        startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : issue.startDate,
        targetDate:
          dto.targetDate !== undefined ? (dto.targetDate ? new Date(dto.targetDate) : null) : issue.targetDate,
        assigneesJson: dto.assignees !== undefined ? (dto.assignees as any) : (issue.assigneesJson as any),
      },
      include: {
        status: true,
        project: true,
      },
    });

    // Re-index issue to RAG if name or description changed (non-blocking)
    if (dto.name !== undefined || dto.description !== undefined) {
      this.indexIssueToRAG(updated, updated.project, orgId).catch((err: Error) => {
        this.logger.error(`Failed to re-index issue ${updated.id} to RAG: ${err.message}`);
      });
    }

    return this.mapToResponse(updated);
  }

  async reorder(projectId: string, issueId: string, dto: ReorderIssueDto, orgId: string): Promise<void> {
    // Validate project belongs to organization
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        orgId,
      },
    });
    if (!project) {
      throw new NotFoundException(`Project not found in your organization: ${projectId}`);
    }

    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });
    if (!issue) {
      throw new NotFoundException(`Issue not found: ${issueId}`);
    }
    if (issue.projectId !== projectId) {
      throw new BadRequestException("Issue does not belong to project");
    }

    // Validate target sprint if provided
    let targetSprintId = dto.toSprintId || null;
    if (targetSprintId) {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: targetSprintId },
      });
      if (!sprint) {
        throw new NotFoundException(`Sprint not found: ${targetSprintId}`);
      }
      if (sprint.projectId !== projectId) {
        throw new BadRequestException("Sprint does not belong to project");
      }
    }

    // Get ordered issues in target sprint/backlog (excluding the moving issue)
    const targetIssues = await this.getOrderedIssues(projectId, targetSprintId);
    const siblings = targetIssues.filter((i) => i.id !== issueId);

    // Calculate new sort order
    const newSortOrder = await this.calculateNewSortOrder(dto, siblings);

    // Update issue
    await this.prisma.issue.update({
      where: { id: issueId },
      data: {
        sprintId: targetSprintId,
        sortOrder: new Prisma.Decimal(newSortOrder),
      },
    });
  }

  async delete(id: string, orgId: string): Promise<void> {
    const issue = await this.prisma.issue.findFirst({
      where: {
        id,
        project: {
          orgId,
        },
      },
    });
    if (!issue) {
      throw new NotFoundException(`Issue not found in your organization: ${id}`);
    }
    await this.prisma.issue.delete({
      where: { id },
    });

    // Delete embedding from RAG (non-blocking)
    this.ragClient.deleteBySource('document', `issue:${id}`).catch((err: Error) => {
      this.logger.error(`Failed to delete issue ${id} from RAG: ${err.message}`);
    });
  }

  private async getNextSequenceId(projectId: string): Promise<number> {
    // Use transaction to prevent race conditions
    return await this.prisma.$transaction(async (tx) => {
      const maxIssue = await tx.issue.findFirst({
        where: { projectId },
        orderBy: { sequenceId: "desc" },
        select: { sequenceId: true },
      });

      return Number(maxIssue?.sequenceId || 0) + 1;
    });
  }

  private async getLastIssueInSprint(projectId: string, sprintId?: string) {
    if (sprintId) {
      return this.prisma.issue.findFirst({
        where: { projectId, sprintId },
        orderBy: { sortOrder: "desc" },
      });
    }
    return this.prisma.issue.findFirst({
      where: { projectId, sprintId: null },
      orderBy: { sortOrder: "desc" },
    });
  }

  private async getOrderedIssues(projectId: string, sprintId: string | null) {
    if (sprintId) {
      return this.prisma.issue.findMany({
        where: { sprintId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
    }
    return this.prisma.issue.findMany({
      where: { projectId, sprintId: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  private async calculateNewSortOrder(dto: ReorderIssueDto, siblings: any[]): Promise<number> {
    if (siblings.length === 0) {
      return IssueService.DEFAULT_SORT_INCREMENT;
    }

    let before: any = null;
    let after: any = null;
    const destinationId = dto.destinationIssueId;
    const position = dto.position;

    if (destinationId) {
      for (let index = 0; index < siblings.length; index++) {
        const current = siblings[index];
        if (current.id === destinationId) {
          if (position === ReorderPosition.BEFORE) {
            after = current;
            before = index > 0 ? siblings[index - 1] : null;
          } else {
            before = current;
            after = index + 1 < siblings.length ? siblings[index + 1] : null;
          }
          break;
        }
      }
    } else if (position === ReorderPosition.BEFORE) {
      after = siblings[0];
    }

    if (position === ReorderPosition.END || (before === null && after === null)) {
      before = siblings.length > 0 ? siblings[siblings.length - 1] : null;
      after = null;
    }

    return this.computeSortOrder(before, after, siblings);
  }

  private computeSortOrder(before: any, after: any, siblings: any[]): number {
    if (before === null && after === null) {
      return IssueService.DEFAULT_SORT_INCREMENT;
    }

    if (before === null && after !== null) {
      const afterSort = Number(after.sortOrder);
      if (afterSort <= 0) {
        // Need to normalize
        return afterSort / 2;
      }
      return afterSort / 2;
    }

    if (after === null && before !== null) {
      const beforeSort = Number(before.sortOrder);
      return beforeSort + IssueService.DEFAULT_SORT_INCREMENT;
    }

    const beforeSort = Number(before.sortOrder);
    const afterSort = Number(after.sortOrder);

    if (Math.abs(afterSort - beforeSort) <= IssueService.MIN_SORT_GAP) {
      // Gap too small, should normalize but for simplicity, just use average
      return (beforeSort + afterSort) / 2;
    }

    return (beforeSort + afterSort) / 2;
  }

  private mapToResponse(issue: any): IssueResponseDto {
    return {
      id: issue.id,
      projectId: issue.projectId,
      sprintId: issue.sprintId,
      parentId: issue.parentId,
      statusId: issue.statusId,
      status: issue.status
        ? {
            id: issue.status.id,
            projectId: issue.status.projectId,
            name: issue.status.name,
            description: issue.status.description,
            color: issue.status.color,
            order: issue.status.order,
            createdAt: issue.status.createdAt,
            updatedAt: issue.status.updatedAt,
          }
        : undefined,
      name: issue.name,
      description: issue.description,
      descriptionHtml: issue.descriptionHtml,
      priority: issue.priority,
      type: issue.type,
      point: issue.point ? Number(issue.point) : null,
      sequenceId: Number(issue.sequenceId),
      sortOrder: Number(issue.sortOrder),
      startDate: issue.startDate ? issue.startDate.toISOString().split("T")[0] : null,
      targetDate: issue.targetDate ? issue.targetDate.toISOString().split("T")[0] : null,
      assignees: Array.isArray(issue.assigneesJson) ? issue.assigneesJson : [],
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      createdBy: issue.createdBy || null,
    };
  }

  /**
   * Find all issues assigned to a specific user across all their projects
   */
  async findAssignedToUser(userId: string, orgId: string, projectIds?: string[]): Promise<IssueResponseDto[]> {
    // If userId is empty, return empty array
    if (!userId || userId.trim() === "") {
      return [];
    }

    // Build project filter - either specific projects or all projects in org
    const projectFilter = projectIds && projectIds.length > 0
      ? { id: { in: projectIds }, orgId }
      : { orgId };

    const issues = await this.prisma.issue.findMany({
      where: {
        project: projectFilter,
        // Filter by assigneesJson containing userId
        assigneesJson: {
          array_contains: [userId],
        },
      },
      include: {
        status: true,
        project: {
          select: {
            id: true,
            name: true,
            identifier: true,
          },
        },
      },
      orderBy: [
        { targetDate: { sort: 'asc', nulls: 'last' } },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return issues.map((issue) => ({
      ...this.mapToResponse(issue),
      project: issue.project ? {
        id: issue.project.id,
        name: issue.project.name,
        identifier: issue.project.identifier,
      } : undefined,
    }));
  }

  async getProjectAnalytics(projectId: string, orgId: string) {
    const normalizeStatus = (name?: string | null) => (name || "").trim().toUpperCase();

    const issues = await this.prisma.issue.findMany({
      where: {
        projectId,
        project: { orgId },
      },
      select: {
        id: true,
        sprintId: true,
        createdAt: true,
        updatedAt: true,
        status: {
          select: {
            name: true,
          },
        },
      },
    });

    const total = issues.length;
    const completed = issues.filter((i) => normalizeStatus(i.status?.name) === "DONE").length;
    const started = issues.filter(
      (i) => {
        const statusName = normalizeStatus(i.status?.name);
        return statusName === "IN PROGRESS" || statusName === "IN REVIEW";
      }
    ).length;
    const unstarted = issues.filter((i) => normalizeStatus(i.status?.name) === "TO DO").length;
    const backlog = issues.filter((i) => !i.sprintId).length;

    const now = new Date();
    const labels: string[] = [];
    const buckets: Record<string, { created: number; resolved: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      labels.push(key);
      buckets[key] = { created: 0, resolved: 0 };
    }

    issues.forEach((issue) => {
      const cDate = issue.createdAt ? new Date(issue.createdAt) : null;
      if (cDate) {
        const key = `${cDate.getFullYear()}-${cDate.getMonth() + 1}`;
        if (buckets[key]) buckets[key].created += 1;
      }
      if (normalizeStatus(issue.status?.name) === "DONE" && issue.updatedAt) {
        const rDate = new Date(issue.updatedAt);
        const key = `${rDate.getFullYear()}-${rDate.getMonth() + 1}`;
        if (buckets[key]) buckets[key].resolved += 1;
      }
    });

    const timeline = labels.map((label) => ({
      label,
      created: buckets[label]?.created ?? 0,
      resolved: buckets[label]?.resolved ?? 0,
    }));

    return {
      counts: { total, completed, started, unstarted, backlog },
      timeline,
    };
  }

  /**
   * Batch index all issues for an organization to RAG (offline indexing)
   */
  async indexAllIssuesToRAG(orgId: string): Promise<{ indexed: number; failed: number }> {
    const issues = await this.prisma.issue.findMany({
      where: {
        project: { orgId },
      },
      include: {
        status: true,
        project: {
          select: {
            id: true,
            name: true,
            identifier: true,
          },
        },
      },
    });

    let indexed = 0;
    let failed = 0;

    for (const issue of issues) {
      try {
        await this.indexIssueToRAG(issue, issue.project, orgId);
        indexed++;
      } catch (err) {
        this.logger.error(`Failed to index issue ${issue.id}: ${err}`);
        failed++;
      }
    }

    this.logger.log(`Batch indexed ${indexed} issues, ${failed} failed for org ${orgId}`);
    return { indexed, failed };
  }

  /**
   * Batch index issues for a specific project to RAG
   */
  async indexProjectIssuesToRAG(projectId: string, orgId: string): Promise<{ indexed: number; failed: number }> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, orgId },
      select: { id: true, name: true, identifier: true },
    });

    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`);
    }

    const issues = await this.prisma.issue.findMany({
      where: { projectId },
      include: { status: true },
    });

    let indexed = 0;
    let failed = 0;

    for (const issue of issues) {
      try {
        await this.indexIssueToRAG(issue, project, orgId);
        indexed++;
      } catch (err) {
        this.logger.error(`Failed to index issue ${issue.id}: ${err}`);
        failed++;
      }
    }

    this.logger.log(`Batch indexed ${indexed} issues for project ${projectId}, ${failed} failed`);
    return { indexed, failed };
  }

  /**
   * Index an issue to RAG for semantic search
   */
  private async indexIssueToRAG(
    issue: any,
    project: { id: string; name: string; identifier: string },
    orgId: string,
  ): Promise<void> {
    // Build searchable content from issue
    const content = this.buildIssueContent(issue, project);

    await this.ragClient.indexShortText({
      namespaceId: project.id,
      namespaceType: 'project',
      orgId,
      sourceType: 'document',
      sourceId: `issue:${issue.id}`,
      content,
      metadata: {
        type: 'issue',
        issueId: issue.id,
        issueName: issue.name,
        issueType: issue.type,
        priority: issue.priority,
        status: issue.status?.name,
        projectId: project.id,
        projectName: project.name,
        projectIdentifier: project.identifier,
        sequenceId: issue.sequenceId,
      },
    });

    this.logger.debug(`Indexed issue ${issue.id} to RAG`);
  }

  /**
   * Build searchable content from issue
   */
  private buildIssueContent(
    issue: any,
    project: { name: string; identifier: string },
  ): string {
    const parts: string[] = [];

    // Title with project context
    parts.push(`Issue: ${issue.name}`);
    parts.push(`Project: ${project.name} (${project.identifier})`);

    // Type and priority
    parts.push(`Type: ${issue.type}`);
    parts.push(`Priority: ${issue.priority}`);

    // Status
    if (issue.status?.name) {
      parts.push(`Status: ${issue.status.name}`);
    }

    // Description
    if (issue.description) {
      parts.push(`Description: ${issue.description}`);
    }

    // Dates
    if (issue.startDate) {
      parts.push(`Start Date: ${issue.startDate}`);
    }
    if (issue.targetDate) {
      parts.push(`Target Date: ${issue.targetDate}`);
    }

    return parts.join('\n');
  }

  /**
   * Search issues with optional AI semantic search
   */
  async searchIssues(dto: SearchIssuesDto, orgId: string): Promise<SearchIssuesResponseDto> {
    const {
      query,
      useAI = false,
      priorities,
      types,
      statusIds,
      sprintIds,
      noSprint,
      page = 1,
      limit = 20,
    } = dto;

    // If AI search is enabled and query provided
    if (useAI && query && query.trim()) {
      return this.aiSemanticSearch(dto, orgId);
    }

    // Normal text search with filters
    return this.normalTextSearch(dto, orgId);
  }

  /**
   * AI Semantic Search using RAG
   */
  private async aiSemanticSearch(dto: SearchIssuesDto, orgId: string): Promise<SearchIssuesResponseDto> {
    const { query, limit = 20, page = 1, priorities, types, statusIds, sprintIds, noSprint } = dto;

    // Get similar issues using vector search
    const similarIssues = await this.ragService.findSimilarIssues({
      query: query!,
      limit: limit * 2, // Get more results for filtering
      threshold: 0.65, // Lower threshold for more results
    });

    // Convert to full issue objects with status
    let issueIds = similarIssues.map((si) => si.id);

    // Build filter where clause
    const where: Prisma.IssueWhereInput = {
      id: { in: issueIds },
      project: { orgId },
    };

    // Apply additional filters
    if (priorities && priorities.length > 0) {
      where.priority = { in: priorities };
    }
    if (types && types.length > 0) {
      where.type = { in: types };
    }
    if (statusIds && statusIds.length > 0) {
      where.statusId = { in: statusIds };
    }
    if (sprintIds && sprintIds.length > 0) {
      where.sprintId = { in: sprintIds };
    }
    if (noSprint) {
      where.sprintId = null;
    }

    // Fetch issues with filters
    const issues = await this.prisma.issue.findMany({
      where,
      include: {
        status: true,
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Map similarity scores
    const similarityMap = new Map<string, number>(similarIssues.map((si) => [si.id, si.similarity]));

    // Build search results with similarity scores
    const results: SearchResultDto[] = issues.map((issue) => ({
      id: issue.id,
      name: issue.name,
      description: issue.description || undefined,
      type: issue.type,
      priority: issue.priority,
      projectId: issue.projectId,
      status: {
        id: issue.status.id,
        name: issue.status.name,
        color: issue.status.color,
      },
      similarity: similarityMap.get(issue.id),
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    }));

    // Sort by similarity score
    results.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    const total = results.length;
    const totalPages = Math.ceil(total / limit);

    return {
      results,
      total,
      page,
      limit,
      totalPages,
      query: query!,
      useAI: true,
    };
  }

  /**
   * Normal text search with filters
   */
  private async normalTextSearch(dto: SearchIssuesDto, orgId: string): Promise<SearchIssuesResponseDto> {
    const { query, limit = 20, page = 1, priorities, types, statusIds, sprintIds, noSprint } = dto;

    // Build where clause
    const where: Prisma.IssueWhereInput = {
      project: { orgId },
    };

    // Text search
    if (query && query.trim()) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    // Apply filters
    if (priorities && priorities.length > 0) {
      where.priority = { in: priorities };
    }
    if (types && types.length > 0) {
      where.type = { in: types };
    }
    if (statusIds && statusIds.length > 0) {
      where.statusId = { in: statusIds };
    }
    if (sprintIds && sprintIds.length > 0) {
      where.sprintId = { in: sprintIds };
    }
    if (noSprint) {
      where.sprintId = null;
    }

    // Get total count
    const total = await this.prisma.issue.count({ where });

    // Fetch issues
    const issues = await this.prisma.issue.findMany({
      where,
      include: {
        status: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
      skip: (page - 1) * limit,
    });

    // Build search results
    const results: SearchResultDto[] = issues.map((issue) => ({
      id: issue.id,
      name: issue.name,
      description: issue.description || undefined,
      type: issue.type,
      priority: issue.priority,
      projectId: issue.projectId,
      status: {
        id: issue.status.id,
        name: issue.status.name,
        color: issue.status.color,
      },
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      results,
      total,
      page,
      limit,
      totalPages,
      query: query || "",
      useAI: false,
    };
  }
}
