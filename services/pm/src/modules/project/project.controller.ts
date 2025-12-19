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
  ForbiddenException,
} from "@nestjs/common";
import type { RequestWithOrg } from "../../common/interfaces";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { Project } from "@prisma/client";
import { ProjectService } from "./project.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import {
  ProjectResponseDto,
  ProjectLiteResponseDto,
  ProjectIdentifierAvailabilityResponseDto,
} from "./dto/project-response.dto";

type ProjectWithSprints = Project & {
  sprints?: { id: string }[];
};

@ApiTags("projects")
@Controller("api/projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * Check if user has admin/owner role
   */
  private isAdminOrOwner(roles: string[]): boolean {
    return roles.some((role) => ["ADMIN", "OWNER"].includes(role.toUpperCase()));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateProjectDto, @Req() request: RequestWithOrg): Promise<ProjectResponseDto> {
    const { orgId, roles } = request;

    // Only Admin/Owner can create projects
    if (!this.isAdminOrOwner(roles)) {
      throw new ForbiddenException("Only administrators can create projects");
    }

    const project = await this.projectService.create(createDto, orgId);
    return this.toResponseDto(project);
  }

  @Get()
  async findAll(@Req() request: RequestWithOrg): Promise<ProjectLiteResponseDto[]> {
    const { orgId, userId, roles } = request;
    // Use findAllForUser to filter projects based on user role
    // Admin/Owner sees all, Member only sees projects they belong to
    const projects = await this.projectService.findAllForUser(orgId, userId, roles);
    return projects.map((p) => this.toLiteDto(p));
  }

  /**
   * Internal endpoint: Get all projects for an organization (for BFF/internal calls)
   * This bypasses user-based filtering
   */
  @Get("all")
  @ApiOperation({ summary: "Get all projects (internal)" })
  async findAllInternal(@Req() request: RequestWithOrg): Promise<ProjectLiteResponseDto[]> {
    const { orgId } = request;
    const projects = await this.projectService.findAll(orgId);
    return projects.map((p) => this.toLiteDto(p));
  }

  @Get("check-identifier")
  async checkIdentifier(
    @Query("identifier") identifier: string,
    @Req() request: RequestWithOrg
  ): Promise<ProjectIdentifierAvailabilityResponseDto> {
    const orgId = request.orgId;
    const available = await this.projectService.checkIdentifierAvailability(identifier, orgId);
    return { identifier, available };
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string, @Req() request: RequestWithOrg): Promise<ProjectResponseDto> {
    const orgId = request.orgId;
    const project = await this.projectService.findOne(id, orgId);
    return this.toResponseDto(project);
  }

  @Put(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProjectDto,
    @Req() request: RequestWithOrg
  ): Promise<ProjectResponseDto> {
    const { orgId, roles } = request;

    // Only Admin/Owner can update projects
    if (!this.isAdminOrOwner(roles)) {
      throw new ForbiddenException("Only administrators can update projects");
    }

    const project = await this.projectService.update(id, updateDto, orgId);
    return this.toResponseDto(project);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string, @Req() request: RequestWithOrg): Promise<void> {
    const { orgId, roles } = request;

    // Only Admin/Owner can delete projects
    if (!this.isAdminOrOwner(roles)) {
      throw new ForbiddenException("Only administrators can delete projects");
    }

    await this.projectService.remove(id, orgId);
  }

  private toResponseDto(project: ProjectWithSprints): ProjectResponseDto {
    return {
      id: project.id,
      orgId: project.orgId,
      identifier: project.identifier,
      name: project.name,
      projectLead: project.projectLead,
      defaultAssignee: project.defaultAssignee,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      sprintIds: project.sprints?.map((s) => s.id) || [],
    };
  }

  private toLiteDto(project: Project & { issueCount?: number; sprintCount?: number }): ProjectLiteResponseDto {
    return {
      id: project.id,
      identifier: project.identifier,
      name: project.name,
      orgId: project.orgId,
      projectLead: project.projectLead,
      issueCount: project.issueCount ?? 0,
      sprintCount: project.sprintCount ?? 0,
    };
  }
}
