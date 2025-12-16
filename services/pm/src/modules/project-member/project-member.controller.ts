import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from "@nestjs/common";
import type { RequestWithOrg } from "../../common/interfaces";
import { ProjectMemberService } from "./project-member.service";
import { UpdateMemberProjectsDto } from "./dto/update-member-projects.dto";

@Controller("api/project-members")
export class ProjectMemberController {
  constructor(private readonly projectMemberService: ProjectMemberService) {}

  /**
   * Get all project memberships for a user
   * GET /api/project-members/users/:userId
   */
  @Get("users/:userId")
  async getUserProjects(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Req() request: RequestWithOrg
  ) {
    return this.projectMemberService.getUserProjects(userId, request.orgId);
  }

  /**
   * Update all project memberships for a user (sync operation)
   * PUT /api/project-members/users/:userId
   */
  @Put("users/:userId")
  async updateUserProjects(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() dto: UpdateMemberProjectsDto,
    @Req() request: RequestWithOrg
  ) {
    return this.projectMemberService.updateUserProjects(
      userId,
      request.orgId,
      dto.projectIds,
      dto.role
    );
  }

  /**
   * Get all members of a project
   * GET /api/project-members/projects/:projectId
   */
  @Get("projects/:projectId")
  async getProjectMembers(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Req() request: RequestWithOrg
  ) {
    return this.projectMemberService.getProjectMembers(projectId, request.orgId);
  }

  /**
   * Add a member to a project
   * POST /api/project-members/projects/:projectId/users/:userId
   */
  @Post("projects/:projectId/users/:userId")
  @HttpCode(HttpStatus.CREATED)
  async addMemberToProject(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() body: { role?: string },
    @Req() request: RequestWithOrg
  ) {
    return this.projectMemberService.addMemberToProject(
      projectId,
      userId,
      request.orgId,
      body.role
    );
  }

  /**
   * Remove a member from a project
   * DELETE /api/project-members/projects/:projectId/users/:userId
   */
  @Delete("projects/:projectId/users/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMemberFromProject(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Req() request: RequestWithOrg
  ) {
    return this.projectMemberService.removeMemberFromProject(
      projectId,
      userId,
      request.orgId
    );
  }

  /**
   * Get project roles for multiple users (bulk query for Identity service)
   * POST /api/project-members/bulk-user-roles
   */
  @Post("bulk-user-roles")
  async getProjectRolesForUsers(
    @Body() body: { userIds: string[] },
    @Req() request: RequestWithOrg
  ) {
    return this.projectMemberService.getProjectRolesForUsers(
      body.userIds,
      request.orgId
    );
  }
}
