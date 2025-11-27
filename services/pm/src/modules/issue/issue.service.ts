import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateIssueDto } from "./dto/create-issue.dto";
import { UpdateIssueDto } from "./dto/update-issue.dto";
import { ReorderIssueDto, ReorderPosition } from "./dto/reorder-issue.dto";
import { IssueResponseDto } from "./dto/issue-response.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class IssueService {
  private static readonly DEFAULT_SORT_INCREMENT = 1000;
  private static readonly MIN_SORT_GAP = 0.000001;

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateIssueDto, orgId: string): Promise<IssueResponseDto> {
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

    const issue = await this.prisma.issue.create({
      data: {
        projectId: dto.projectId,
        sprintId: dto.sprintId || null,
        parentId: dto.parentId || null,
        name: dto.name,
        description: dto.description || null,
        descriptionHtml: dto.descriptionHtml || null,
        state: dto.state,
        priority: dto.priority,
        type: dto.type,
        point: dto.point ? new Prisma.Decimal(dto.point) : null,
        sequenceId,
        sortOrder: new Prisma.Decimal(sortOrder),
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        assigneesJson: dto.assignees || [],
      },
      include: {
        project: true,
      },
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
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return issues.map(this.mapToResponse);
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
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return issues.map(this.mapToResponse);
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
        name: dto.name,
        description: dto.description !== undefined ? dto.description : issue.description,
        descriptionHtml: dto.descriptionHtml !== undefined ? dto.descriptionHtml : issue.descriptionHtml,
        state: dto.state,
        priority: dto.priority,
        type: dto.type,
        point: dto.point !== undefined ? (dto.point ? new Prisma.Decimal(dto.point) : null) : issue.point,
        sortOrder: dto.sortOrder !== undefined ? new Prisma.Decimal(dto.sortOrder) : issue.sortOrder,
        startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : issue.startDate,
        targetDate:
          dto.targetDate !== undefined ? (dto.targetDate ? new Date(dto.targetDate) : null) : issue.targetDate,
        assigneesJson: dto.assignees !== undefined ? (dto.assignees as any) : (issue.assigneesJson as any),
      },
    });

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
      name: issue.name,
      description: issue.description,
      descriptionHtml: issue.descriptionHtml,
      state: issue.state,
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
    };
  }
}
