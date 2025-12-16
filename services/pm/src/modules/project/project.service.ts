import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { IssueStatusService } from "../issue-status/issue-status.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private issueStatusService: IssueStatusService
  ) {}

  private generateIdentifierFromName(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);
  }

  private async generateUniqueIdentifier(baseName: string, orgId: string): Promise<string> {
    const base = this.generateIdentifierFromName(baseName);
    if (!base) {
      // Fallback to random if name has no valid chars
      return Math.random().toString(36).substring(2, 7).toUpperCase();
    }

    // Try base identifier first
    if (await this.checkIdentifierAvailability(base, orgId)) {
      return base;
    }

    // Try with numeric suffix
    for (let i = 1; i <= 99; i++) {
      const suffix = i.toString();
      const candidate = (base.slice(0, 5 - suffix.length) + suffix).slice(0, 5);
      if (await this.checkIdentifierAvailability(candidate, orgId)) {
        return candidate;
      }
    }

    // Fallback: random suffix
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return (base.slice(0, 3) + random).slice(0, 5);
  }

  async create(createDto: CreateProjectDto, orgId: string) {
    const name = createDto.name.trim();

    // Generate or use provided identifier
    let identifier: string;
    if (createDto.identifier) {
      identifier = createDto.identifier.trim().toUpperCase();
    } else {
      identifier = await this.generateUniqueIdentifier(name, orgId);
    }

    // Check unique identifier within organization (case-insensitive)
    const existingByIdentifier = await this.prisma.project.findFirst({
      where: {
        orgId,
        identifier: {
          equals: identifier,
          mode: "insensitive",
        },
      },
    });

    if (existingByIdentifier) {
      throw new ConflictException({
        identifier: `Project with identifier '${identifier}' already exists in your organization`,
      });
    }

    // Check unique name within organization (case-insensitive)
    const existingByName = await this.prisma.project.findFirst({
      where: {
        orgId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingByName) {
      throw new ConflictException({
        name: `Project with name '${name}' already exists in your organization`,
      });
    }

    // Create project
    const project = await this.prisma.project.create({
      data: {
        orgId,
        identifier,
        name,
        description: createDto.description,
        projectLead: createDto.projectLead,
        defaultAssignee: createDto.defaultAssignee,
      },
    });

    // Create default issue statuses for the project
    await this.issueStatusService.createDefaultStatuses(project.id);

    return project;
  }

  async findAll(orgId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            issues: true,
            sprints: true,
          },
        },
      },
    });

    return projects.map((project) => ({
      ...project,
      issueCount: project._count.issues,
      sprintCount: project._count.sprints,
      _count: undefined,
    }));
  }

  async findOne(id: string, orgId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        orgId,
      },
      include: {
        sprints: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found in your organization`);
    }

    return project;
  }

  async checkIdentifierAvailability(identifier: string, orgId: string): Promise<boolean> {
    const existing = await this.prisma.project.findFirst({
      where: {
        orgId,
        identifier: {
          equals: identifier,
          mode: "insensitive",
        },
      },
    });

    return !existing;
  }

  async update(id: string, updateDto: UpdateProjectDto, orgId: string) {
    // Check if project exists in organization
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found in your organization`);
    }

    // If updating identifier, check uniqueness within organization
    if (updateDto.identifier) {
      const identifier = updateDto.identifier.trim().toUpperCase();

      const existingByIdentifier = await this.prisma.project.findFirst({
        where: {
          orgId,
          identifier: {
            equals: identifier,
            mode: "insensitive",
          },
          NOT: {
            id,
          },
        },
      });

      if (existingByIdentifier) {
        throw new ConflictException({
          identifier: `Project with identifier '${identifier}' already exists in your organization`,
        });
      }

      updateDto.identifier = identifier;
    }

    // If updating name, check uniqueness within organization
    if (updateDto.name) {
      const name = updateDto.name.trim();

      const existingByName = await this.prisma.project.findFirst({
        where: {
          orgId,
          name: {
            equals: name,
            mode: "insensitive",
          },
          NOT: {
            id,
          },
        },
      });

      if (existingByName) {
        throw new ConflictException({
          name: `Project with name '${name}' already exists in your organization`,
        });
      }

      updateDto.name = name;
    }

    return this.prisma.project.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, orgId: string) {
    // Check if project exists in organization
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found in your organization`);
    }

    await this.prisma.project.delete({
      where: { id },
    });
  }
}
