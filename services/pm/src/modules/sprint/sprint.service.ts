import { Injectable, NotFoundException } from "@nestjs/common";
import { SprintStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSprintDto } from "./dto/create-sprint.dto";
import { UpdateSprintDto } from "./dto/update-sprint.dto";

@Injectable()
export class SprintService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSprintDto, orgId: string) {
    // Validate project exists and belongs to organization
    const project = await this.prisma.project.findFirst({
      where: {
        id: createDto.projectId,
        orgId,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${createDto.projectId} not found in your organization`);
    }

    return this.prisma.sprint.create({
      data: {
        projectId: createDto.projectId,
        name: createDto.name,
        status: createDto.status || SprintStatus.FUTURE,
        goal: createDto.goal,
        startDate: createDto.startDate ? new Date(createDto.startDate) : null,
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
      },
    });
  }

  async findOne(id: string, orgId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id,
        project: {
          orgId,
        },
      },
      include: {
        issues: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint with ID ${id} not found in your organization`);
    }

    return sprint;
  }

  async findByProject(projectId: string, orgId: string) {
    // Validate project exists and belongs to organization
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        orgId,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found in your organization`);
    }

    return this.prisma.sprint.findMany({
      where: { projectId },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async update(id: string, updateDto: UpdateSprintDto, orgId: string) {
    // Check if sprint exists and belongs to organization
    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id,
        project: {
          orgId,
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint with ID ${id} not found in your organization`);
    }

    // Prepare update data
    const updateData: any = {
      name: updateDto.name,
      status: updateDto.status,
      goal: updateDto.goal,
      startDate: updateDto.startDate ? new Date(updateDto.startDate) : undefined,
      endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
    };

    // If changing status to ACTIVE and not already ACTIVE, snapshot metrics
    if (updateDto.status === SprintStatus.ACTIVE && sprint.status !== SprintStatus.ACTIVE) {
      try {
        // Count issues and sum story points in this sprint
        const issueCount = await this.prisma.issue.count({
          where: { sprintId: id },
        });

        const storyPointsAggregate = await this.prisma.issue.aggregate({
          where: { sprintId: id },
          _sum: { point: true },
        });

        // Add snapshot metrics (only if migration has been run)
        updateData.initialIssueCount = issueCount;
        updateData.initialStoryPoints = storyPointsAggregate._sum.point || 0;
        updateData.startedAt = new Date();
      } catch (error) {
        // If columns don't exist yet (migration not run), just update status without metrics
        console.warn('Sprint metrics columns not found. Please run migration: npx prisma migrate deploy');
      }
    }

    return this.prisma.sprint.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, orgId: string) {
    // Check if sprint exists and belongs to organization
    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id,
        project: {
          orgId,
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint with ID ${id} not found in your organization`);
    }

    await this.prisma.sprint.delete({
      where: { id },
    });
  }
}
