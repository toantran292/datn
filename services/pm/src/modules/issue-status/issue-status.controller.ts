import { Controller, Get, Post, Put, Delete, Body, Param, Query, Patch } from "@nestjs/common";
import { IssueStatusService } from "./issue-status.service";
import { CreateIssueStatusDto } from "./dto/create-issue-status.dto";
import { UpdateIssueStatusDto } from "./dto/update-issue-status.dto";
import { ReorderIssueStatusDto } from "./dto/reorder-issue-status.dto";
import { IssueStatusResponseDto } from "./dto/issue-status-response.dto";

@Controller("api/issue-statuses")
export class IssueStatusController {
  constructor(private readonly issueStatusService: IssueStatusService) {}

  @Post()
  async create(@Body() createDto: CreateIssueStatusDto): Promise<IssueStatusResponseDto> {
    return this.issueStatusService.create(createDto);
  }

  @Get()
  async findAll(@Query("projectId") projectId: string): Promise<IssueStatusResponseDto[]> {
    return this.issueStatusService.findAll(projectId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<IssueStatusResponseDto> {
    return this.issueStatusService.findOne(id);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() updateDto: UpdateIssueStatusDto): Promise<IssueStatusResponseDto> {
    return this.issueStatusService.update(id, updateDto);
  }

  @Delete(":id")
  async delete(@Param("id") id: string): Promise<void> {
    return this.issueStatusService.delete(id);
  }

  @Patch("reorder")
  async reorder(@Body() reorderDto: ReorderIssueStatusDto): Promise<IssueStatusResponseDto[]> {
    return this.issueStatusService.reorder(reorderDto);
  }
}
