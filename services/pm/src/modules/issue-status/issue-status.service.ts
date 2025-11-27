import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateIssueStatusDto } from "./dto/create-issue-status.dto";
import { UpdateIssueStatusDto } from "./dto/update-issue-status.dto";
import { IssueStatusResponseDto } from "./dto/issue-status-response.dto";

@Injectable()
export class IssueStatusService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateIssueStatusDto): Promise<IssueStatusResponseDto> {
    // Check if project exists
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${dto.projectId} not found`);
    }

    // Check if order is already used in this project
    const existingStatus = await this.prisma.issueStatus.findFirst({
      where: {
        projectId: dto.projectId,
        order: dto.order,
      },
    });

    if (existingStatus) {
      throw new BadRequestException(`Order ${dto.order} is already used in this project`);
    }

    const status = await this.prisma.issueStatus.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        description: dto.description || null,
        color: dto.color,
        order: dto.order,
      },
    });

    return this.mapToResponse(status);
  }

  async findAll(projectId: string): Promise<IssueStatusResponseDto[]> {
    const statuses = await this.prisma.issueStatus.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });

    return statuses.map((status) => this.mapToResponse(status));
  }

  async findOne(id: string): Promise<IssueStatusResponseDto> {
    const status = await this.prisma.issueStatus.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException(`IssueStatus with ID ${id} not found`);
    }

    return this.mapToResponse(status);
  }

  async update(id: string, dto: UpdateIssueStatusDto): Promise<IssueStatusResponseDto> {
    const status = await this.prisma.issueStatus.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException(`IssueStatus with ID ${id} not found`);
    }

    // If order is being updated, check if it conflicts
    if (dto.order !== undefined && dto.order !== status.order) {
      const existingStatus = await this.prisma.issueStatus.findFirst({
        where: {
          projectId: status.projectId,
          order: dto.order,
          id: { not: id },
        },
      });

      if (existingStatus) {
        throw new BadRequestException(`Order ${dto.order} is already used in this project`);
      }
    }

    const updated = await this.prisma.issueStatus.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description !== undefined ? dto.description : status.description,
        color: dto.color,
        order: dto.order,
      },
    });

    return this.mapToResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const status = await this.prisma.issueStatus.findUnique({
      where: { id },
      include: { _count: { select: { issues: true } } },
    });

    if (!status) {
      throw new NotFoundException(`IssueStatus with ID ${id} not found`);
    }

    if (status._count.issues > 0) {
      throw new BadRequestException(
        `Cannot delete status with ${status._count.issues} issues. Please reassign issues first.`
      );
    }

    await this.prisma.issueStatus.delete({
      where: { id },
    });
  }

  async createDefaultStatuses(projectId: string): Promise<IssueStatusResponseDto[]> {
    const defaultStatuses = [
      { name: "TO DO", description: "Issues that are yet to be started", color: "#94A3B8", order: 0 },
      { name: "IN PROGRESS", description: "Issues that are currently being worked on", color: "#3B82F6", order: 1 },
      { name: "IN REVIEW", description: "Issues that are waiting for review", color: "#F59E0B", order: 2 },
      { name: "DONE", description: "Issues that have been completed", color: "#10B981", order: 3 },
    ];

    const createdStatuses = await Promise.all(
      defaultStatuses.map((status) =>
        this.prisma.issueStatus.create({
          data: {
            projectId,
            ...status,
          },
        })
      )
    );

    return createdStatuses.map((status) => this.mapToResponse(status));
  }

  private mapToResponse(status: any): IssueStatusResponseDto {
    return {
      id: status.id,
      projectId: status.projectId,
      name: status.name,
      description: status.description,
      color: status.color,
      order: status.order,
      createdAt: status.createdAt,
      updatedAt: status.updatedAt,
    };
  }
}
