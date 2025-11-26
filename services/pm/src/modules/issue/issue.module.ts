import { Module } from "@nestjs/common";
import { IssueController } from "./issue.controller";
import { IssueService } from "./issue.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [IssueController],
  providers: [IssueService],
  exports: [IssueService],
})
export class IssueModule {}
