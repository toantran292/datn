import { Module } from "@nestjs/common";
import { IssueStatusController } from "./issue-status.controller";
import { IssueStatusService } from "./issue-status.service";

@Module({
  controllers: [IssueStatusController],
  providers: [IssueStatusService],
  exports: [IssueStatusService],
})
export class IssueStatusModule {}
