import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe } from "@nestjs/common";
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
  async create(@Body() createDto: CreateSprintDto): Promise<SprintResponseDto> {
    const sprint = await this.sprintService.create(createDto);
    return this.toResponseDto(sprint);
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<SprintResponseDto> {
    const sprint = await this.sprintService.findOne(id);
    return this.toResponseDto(sprint);
  }

  @Patch(":id")
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() updateDto: UpdateSprintDto): Promise<SprintResponseDto> {
    const sprint = await this.sprintService.update(id, updateDto);
    return this.toResponseDto(sprint);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.sprintService.remove(id);
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
