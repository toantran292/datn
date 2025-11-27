import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateProjectDto, orgId: string) {
    // Sanitize inputs
    const identifier = createDto.identifier.trim().toUpperCase();
    const name = createDto.name.trim();

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
    return this.prisma.project.create({
      data: {
        orgId,
        identifier,
        name,
        projectLead: createDto.projectLead,
        defaultAssignee: createDto.defaultAssignee,
      },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.project.findMany({
      where: {
        orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
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
