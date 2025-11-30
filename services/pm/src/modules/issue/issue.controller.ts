import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Req } from "@nestjs/common";
import type { RequestWithOrg } from "../../common/interfaces";
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
  async create(@Body() dto: CreateIssueDto, @Req() request: RequestWithOrg): Promise<IssueResponseDto> {
    const orgId = request.orgId;
    const userId = (request.headers["x-user-id"] as string) || "00000000-0000-0000-0000-000000000000";
    return this.issueService.create(dto, orgId, userId);
  }

  @Get("issues/:id")
  async findById(@Param("id") id: string, @Req() request: RequestWithOrg): Promise<IssueResponseDto> {
    const orgId = request.orgId;
    return this.issueService.findById(id, orgId);
  }

  @Get("projects/:projectId/issues")
  async findByProject(
    @Param("projectId") projectId: string,
    @Req() request: RequestWithOrg
  ): Promise<IssueResponseDto[]> {
    const orgId = request.orgId;
    return this.issueService.findByProject(projectId, orgId);
  }

  @Get("sprints/:sprintId/issues")
  async findBySprint(@Param("sprintId") sprintId: string, @Req() request: RequestWithOrg): Promise<IssueResponseDto[]> {
    const orgId = request.orgId;
    return this.issueService.findBySprint(sprintId, orgId);
  }

  @Put("issues/:id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateIssueDto,
    @Req() request: RequestWithOrg
  ): Promise<IssueResponseDto> {
    const orgId = request.orgId;
    return this.issueService.update(id, dto, orgId);
  }

  @Post("projects/:projectId/issues/:issueId/reorder")
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @Param("projectId") projectId: string,
    @Param("issueId") issueId: string,
    @Body() dto: ReorderIssueDto,
    @Req() request: RequestWithOrg
  ): Promise<void> {
    const orgId = request.orgId;
    return this.issueService.reorder(projectId, issueId, dto, orgId);
  }

  @Delete("issues/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @Req() request: RequestWithOrg): Promise<void> {
    const orgId = request.orgId;
    return this.issueService.delete(id, orgId);
  }
}
