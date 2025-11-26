import { Module } from "@nestjs/common";
import { SprintController } from "./sprint.controller";
import { ProjectSprintsController } from "./project-sprints.controller";
import { SprintService } from "./sprint.service";

@Module({
  controllers: [SprintController, ProjectSprintsController],
  providers: [SprintService],
  exports: [SprintService],
})
export class SprintModule {}
