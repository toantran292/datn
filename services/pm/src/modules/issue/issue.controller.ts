import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from "@nestjs/common";
import { IssueService } from "./issue.service";
import { CreateIssueDto } from "./dto/create-issue.dto";
import { UpdateIssueDto } from "./dto/update-issue.dto";
import { ReorderIssueDto } from "./dto/reorder-issue.dto";
import { IssueResponseDto } from "./dto/issue-response.dto";

@Controller("api")
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Post("issues")
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateIssueDto): Promise<IssueResponseDto> {
    return this.issueService.create(dto);
  }

  @Get("issues/:id")
  async findById(@Param("id") id: string): Promise<IssueResponseDto> {
    return this.issueService.findById(id);
  }

  @Get("projects/:projectId/issues")
  async findByProject(@Param("projectId") projectId: string): Promise<IssueResponseDto[]> {
    return this.issueService.findByProject(projectId);
  }

  @Get("sprints/:sprintId/issues")
  async findBySprint(@Param("sprintId") sprintId: string): Promise<IssueResponseDto[]> {
    return this.issueService.findBySprint(sprintId);
  }

  @Put("issues/:id")
  async update(@Param("id") id: string, @Body() dto: UpdateIssueDto): Promise<IssueResponseDto> {
    return this.issueService.update(id, dto);
  }

  @Post("projects/:projectId/issues/:issueId/reorder")
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @Param("projectId") projectId: string,
    @Param("issueId") issueId: string,
    @Body() dto: ReorderIssueDto
  ): Promise<void> {
    return this.issueService.reorder(projectId, issueId, dto);
  }

  @Delete("issues/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string): Promise<void> {
    return this.issueService.delete(id);
  }
}
