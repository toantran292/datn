import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateProjectDto) {
    // Sanitize inputs
    const identifier = createDto.identifier.trim().toUpperCase();
    const name = createDto.name.trim();

    // Check unique identifier (case-insensitive)
    const existingByIdentifier = await this.prisma.project.findFirst({
      where: {
        identifier: {
          equals: identifier,
          mode: "insensitive",
        },
      },
    });

    if (existingByIdentifier) {
      throw new ConflictException({
        identifier: `Project with identifier '${identifier}' already exists`,
      });
    }

    // Check unique name (case-insensitive)
    const existingByName = await this.prisma.project.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingByName) {
      throw new ConflictException({
        name: `Project with name '${name}' already exists`,
      });
    }

    // Create project
    return this.prisma.project.create({
      data: {
        orgId: createDto.orgId,
        identifier,
        name,
        projectLead: createDto.projectLead,
        defaultAssignee: createDto.defaultAssignee,
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        sprints: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async checkIdentifierAvailability(identifier: string): Promise<boolean> {
    const existing = await this.prisma.project.findFirst({
      where: {
        identifier: {
          equals: identifier,
          mode: "insensitive",
        },
      },
    });

    return !existing;
  }

  async update(id: string, updateDto: UpdateProjectDto) {
    // Check if project exists
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // If updating identifier, check uniqueness
    if (updateDto.identifier) {
      const identifier = updateDto.identifier.trim().toUpperCase();

      const existingByIdentifier = await this.prisma.project.findFirst({
        where: {
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
          identifier: `Project with identifier '${identifier}' already exists`,
        });
      }

      updateDto.identifier = identifier;
    }

    // If updating name, check uniqueness
    if (updateDto.name) {
      const name = updateDto.name.trim();

      const existingByName = await this.prisma.project.findFirst({
        where: {
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
          name: `Project with name '${name}' already exists`,
        });
      }

      updateDto.name = name;
    }

    return this.prisma.project.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    // Check if project exists
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    await this.prisma.project.delete({
      where: { id },
    });
  }
}
