import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSprintDto } from "./dto/create-sprint.dto";
import { UpdateSprintDto } from "./dto/update-sprint.dto";

@Injectable()
export class SprintService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSprintDto) {
    // Validate project exists
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${createDto.projectId} not found`);
    }

    return this.prisma.sprint.create({
      data: {
        projectId: createDto.projectId,
        name: createDto.name,
        goal: createDto.goal,
        startDate: createDto.startDate ? new Date(createDto.startDate) : null,
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
      },
    });
  }

  async findOne(id: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        issues: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint with ID ${id} not found`);
    }

    return sprint;
  }

  async findByProject(projectId: string) {
    // Validate project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    return this.prisma.sprint.findMany({
      where: { projectId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(id: string, updateDto: UpdateSprintDto) {
    // Check if sprint exists
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint with ID ${id} not found`);
    }

    return this.prisma.sprint.update({
      where: { id },
      data: {
        name: updateDto.name,
        goal: updateDto.goal,
        startDate: updateDto.startDate ? new Date(updateDto.startDate) : undefined,
        endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    // Check if sprint exists
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint with ID ${id} not found`);
    }

    await this.prisma.sprint.delete({
      where: { id },
    });
  }
}
