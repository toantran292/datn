import { Module } from "@nestjs/common";
import { ProjectMemberController } from "./project-member.controller";
import { ProjectMemberService } from "./project-member.service";

@Module({
  controllers: [ProjectMemberController],
  providers: [ProjectMemberService],
  exports: [ProjectMemberService],
})
export class ProjectMemberModule {}
