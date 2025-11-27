import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from "@nestjs/common";
import type { RequestWithOrg } from "../../common/interfaces";
import { Sprint } from "@prisma/client";
import { SprintService } from "./sprint.service";
import { CreateSprintDto } from "./dto/create-sprint.dto";
import { UpdateSprintDto } from "./dto/update-sprint.dto";
import { SprintResponseDto } from "./dto/sprint-response.dto";

type SprintWithIssues = Sprint & {
  issues?: { id: string }[];
};

@Controller("api/sprints")
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateSprintDto, @Req() request: RequestWithOrg): Promise<SprintResponseDto> {
    const orgId = request.orgId;
    const sprint = await this.sprintService.create(createDto, orgId);
    return this.toResponseDto(sprint);
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string, @Req() request: RequestWithOrg): Promise<SprintResponseDto> {
    const orgId = request.orgId;
    const sprint = await this.sprintService.findOne(id, orgId);
    return this.toResponseDto(sprint);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSprintDto,
    @Req() request: RequestWithOrg
  ): Promise<SprintResponseDto> {
    const orgId = request.orgId;
    const sprint = await this.sprintService.update(id, updateDto, orgId);
    return this.toResponseDto(sprint);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string, @Req() request: RequestWithOrg): Promise<void> {
    const orgId = request.orgId;
    await this.sprintService.remove(id, orgId);
  }

  private toResponseDto(sprint: SprintWithIssues): SprintResponseDto {
    return {
      id: sprint.id,
      projectId: sprint.projectId,
      name: sprint.name,
      status: sprint.status,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      createdAt: sprint.createdAt,
      updatedAt: sprint.updatedAt,
      issueIds: sprint.issues?.map((i) => i.id) || [],
    };
  }
}
