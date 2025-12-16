import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Req } from "@nestjs/common";
import type { RequestWithOrg } from "../../common/interfaces";
import { IssueCommentService } from "./issue-comment.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { CommentResponseDto } from "./dto/comment-response.dto";

@Controller("api")
export class IssueCommentController {
  constructor(private readonly commentService: IssueCommentService) {}

  @Post("issues/:issueId/comments")
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param("issueId") issueId: string,
    @Body() dto: Omit<CreateCommentDto, "issueId">,
    @Req() request: RequestWithOrg
  ): Promise<CommentResponseDto> {
    const orgId = request.orgId;
    const userId = (request.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000000';
    return this.commentService.create({ ...dto, issueId }, userId, orgId);
  }

  @Get("issues/:issueId/comments")
  async findByIssue(@Param("issueId") issueId: string, @Req() request: RequestWithOrg): Promise<CommentResponseDto[]> {
    const orgId = request.orgId;
    return this.commentService.findByIssue(issueId, orgId);
  }

  @Get("comments/:id")
  async findById(@Param("id") id: string, @Req() request: RequestWithOrg): Promise<CommentResponseDto> {
    const orgId = request.orgId;
    return this.commentService.findById(id, orgId);
  }

  @Put("comments/:id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateCommentDto,
    @Req() request: RequestWithOrg
  ): Promise<CommentResponseDto> {
    const orgId = request.orgId;
    const userId = (request.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000000';
    return this.commentService.update(id, dto, userId, orgId);
  }

  @Delete("comments/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @Req() request: RequestWithOrg): Promise<void> {
    const orgId = request.orgId;
    const userId = (request.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000000';
    return this.commentService.delete(id, userId, orgId);
  }
}
