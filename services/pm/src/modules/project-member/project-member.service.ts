import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ProjectMemberService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all project memberships for a user within an organization
   */
  async getUserProjects(userId: string, orgId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: {
        userId,
        project: {
          orgId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            identifier: true,
          },
        },
      },
    });

    return {
      userId,
      projects: memberships.map((m) => ({
        id: m.id,
        projectId: m.projectId,
        projectName: m.project.name,
        projectIdentifier: m.project.identifier,
        role: m.role,
      })),
    };
  }

  /**
   * Get all members of a project
   */
  async getProjectMembers(projectId: string, orgId: string) {
    // Verify project belongs to org
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, orgId },
    });

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    return members;
  }

  /**
   * Update all project memberships for a user (sync operation)
   * This replaces all existing project memberships with the new list
   */
  async updateUserProjects(
    userId: string,
    orgId: string,
    projectIds: string[],
    role: string = "member"
  ) {
    // Verify all projects belong to the org
    const validProjects = await this.prisma.project.findMany({
      where: {
        id: { in: projectIds },
        orgId,
      },
      select: { id: true },
    });

    const validProjectIds = new Set(validProjects.map((p) => p.id));

    // Filter out invalid project IDs
    const finalProjectIds = projectIds.filter((id) => validProjectIds.has(id));

    // Get current memberships for this user in this org
    const currentMemberships = await this.prisma.projectMember.findMany({
      where: {
        userId,
        project: {
          orgId,
        },
      },
      select: { id: true, projectId: true },
    });

    const currentProjectIds = new Set(currentMemberships.map((m) => m.projectId));

    // Determine which to add and which to remove
    const toAdd = finalProjectIds.filter((id) => !currentProjectIds.has(id));
    const toRemove = currentMemberships.filter((m) => !finalProjectIds.includes(m.projectId));

    // Perform the sync in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Remove old memberships
      if (toRemove.length > 0) {
        await tx.projectMember.deleteMany({
          where: {
            id: { in: toRemove.map((m) => m.id) },
          },
        });
      }

      // Add new memberships
      if (toAdd.length > 0) {
        await tx.projectMember.createMany({
          data: toAdd.map((projectId) => ({
            projectId,
            userId,
            role,
          })),
        });
      }
    });

    // Return updated memberships
    return this.getUserProjects(userId, orgId);
  }

  /**
   * Add a single user to a project
   */
  async addMemberToProject(
    projectId: string,
    userId: string,
    orgId: string,
    role: string = "member"
  ) {
    // Verify project belongs to org
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, orgId },
    });

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    // Check if membership already exists
    const existing = await this.prisma.projectMember.findUnique({
      where: {
        unique_project_user: {
          projectId,
          userId,
        },
      },
    });

    if (existing) {
      // Update role if different
      if (existing.role !== role) {
        return this.prisma.projectMember.update({
          where: { id: existing.id },
          data: { role },
        });
      }
      return existing;
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      },
    });
  }

  /**
   * Remove a user from a project
   */
  async removeMemberFromProject(projectId: string, userId: string, orgId: string) {
    // Verify project belongs to org
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, orgId },
    });

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        unique_project_user: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException(`Membership not found`);
    }

    await this.prisma.projectMember.delete({
      where: { id: membership.id },
    });

    return { success: true };
  }

  /**
   * Get project roles for multiple users (for Identity service enrichment)
   */
  async getProjectRolesForUsers(userIds: string[], orgId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: {
        userId: { in: userIds },
        project: {
          orgId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            identifier: true,
          },
        },
      },
    });

    // Group by userId
    const result: Record<string, Array<{
      projectId: string;
      projectName: string;
      projectIdentifier: string;
      role: string;
    }>> = {};

    for (const m of memberships) {
      if (!result[m.userId]) {
        result[m.userId] = [];
      }
      result[m.userId].push({
        projectId: m.project.id,
        projectName: m.project.name,
        projectIdentifier: m.project.identifier,
        role: m.role,
      });
    }

    return result;
  }
}
