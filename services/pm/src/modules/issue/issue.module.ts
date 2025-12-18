import { Module } from "@nestjs/common";
import { IssueController } from "./issue.controller";
import { IssueService } from "./issue.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { RagModule } from "../rag/rag.module";

@Module({
  imports: [PrismaModule, RagModule],
  controllers: [IssueController],
  providers: [IssueService],
  exports: [IssueService],
})
export class IssueModule {}
