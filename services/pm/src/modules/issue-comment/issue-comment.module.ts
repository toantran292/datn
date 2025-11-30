import { Module } from "@nestjs/common";
import { IssueCommentController } from "./issue-comment.controller";
import { IssueCommentService } from "./issue-comment.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [IssueCommentController],
  providers: [IssueCommentService],
  exports: [IssueCommentService],
})
export class IssueCommentModule {}
