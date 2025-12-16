import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { CommentResponseDto } from "./dto/comment-response.dto";

@Injectable()
export class IssueCommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommentDto, userId: string, orgId: string): Promise<CommentResponseDto> {
    // Verify issue exists and belongs to org
    const issue = await this.prisma.issue.findFirst({
      where: {
        id: dto.issueId,
        projectId: dto.projectId,
        project: {
          orgId,
        },
      },
    });

    if (!issue) {
      throw new NotFoundException("Issue not found");
    }

    const comment = await this.prisma.issueComment.create({
      data: {
        issueId: dto.issueId,
        projectId: dto.projectId,
        comment: dto.comment,
        commentHtml: dto.commentHtml,
        createdBy: userId,
      },
    });

    return this.toResponse(comment);
  }

  async findByIssue(issueId: string, orgId: string): Promise<CommentResponseDto[]> {
    const comments = await this.prisma.issueComment.findMany({
      where: {
        issueId,
        project: {
          orgId,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return comments.map((comment) => this.toResponse(comment));
  }

  async findById(id: string, orgId: string): Promise<CommentResponseDto> {
    const comment = await this.prisma.issueComment.findFirst({
      where: {
        id,
        project: {
          orgId,
        },
      },
    });

    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    return this.toResponse(comment);
  }

  async update(id: string, dto: UpdateCommentDto, userId: string, orgId: string): Promise<CommentResponseDto> {
    const existing = await this.prisma.issueComment.findFirst({
      where: {
        id,
        project: {
          orgId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Comment not found");
    }

    if (existing.createdBy !== userId) {
      throw new ForbiddenException("You can only edit your own comments");
    }

    const updated = await this.prisma.issueComment.update({
      where: { id },
      data: {
        comment: dto.comment,
        commentHtml: dto.commentHtml,
        updatedBy: userId,
      },
    });

    return this.toResponse(updated);
  }

  async delete(id: string, userId: string, orgId: string): Promise<void> {
    const existing = await this.prisma.issueComment.findFirst({
      where: {
        id,
        project: {
          orgId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Comment not found");
    }

    if (existing.createdBy !== userId) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    await this.prisma.issueComment.delete({
      where: { id },
    });
  }

  private toResponse(comment: any): CommentResponseDto {
    return {
      id: comment.id,
      issueId: comment.issueId,
      projectId: comment.projectId,
      comment: comment.comment,
      commentHtml: comment.commentHtml,
      createdBy: comment.createdBy,
      updatedBy: comment.updatedBy,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
