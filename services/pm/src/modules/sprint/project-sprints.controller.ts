import { Controller, Get, Param, ParseUUIDPipe, Req } from "@nestjs/common";
import type { RequestWithOrg } from "../../common/interfaces";
import { Sprint } from "@prisma/client";
import { SprintService } from "./sprint.service";
import { SprintResponseDto } from "./dto/sprint-response.dto";

@Controller("api/projects/:projectId/sprints")
export class ProjectSprintsController {
  constructor(private readonly sprintService: SprintService) {}

  @Get()
  async findByProject(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Req() request: RequestWithOrg
  ): Promise<SprintResponseDto[]> {
    const orgId = request.orgId;
    const sprints = await this.sprintService.findByProject(projectId, orgId);
    return sprints.map((sprint) => this.toResponseDto(sprint));
  }

  private toResponseDto(sprint: Sprint): SprintResponseDto {
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
      issueIds: [],
    };
  }
}
