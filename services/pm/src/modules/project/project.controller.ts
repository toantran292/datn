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
} from "@nestjs/common";
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectService.create(createDto);
    return this.toResponseDto(project);
  }

  @Get()
  async findAll(): Promise<ProjectLiteResponseDto[]> {
    const projects = await this.projectService.findAll();
    return projects.map((p) => this.toLiteDto(p));
  }

  @Get("check-identifier")
  async checkIdentifier(@Query("identifier") identifier: string): Promise<ProjectIdentifierAvailabilityResponseDto> {
    const available = await this.projectService.checkIdentifierAvailability(identifier);
    return { identifier, available };
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ProjectResponseDto> {
    const project = await this.projectService.findOne(id);
    return this.toResponseDto(project);
  }

  @Put(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProjectDto
  ): Promise<ProjectResponseDto> {
    const project = await this.projectService.update(id, updateDto);
    return this.toResponseDto(project);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.projectService.remove(id);
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

  private toLiteDto(project: Project): ProjectLiteResponseDto {
    return {
      id: project.id,
      identifier: project.identifier,
      name: project.name,
      orgId: project.orgId,
      projectLead: project.projectLead,
    };
  }
}
