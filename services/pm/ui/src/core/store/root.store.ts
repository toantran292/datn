import { IssueStore } from "@/core/store/issue/issue.store";
import { ProjectStore } from "@/core/store/project/project.store";
import { SprintStore } from "@/core/store/sprint/sprint.store";

export interface IProjectRootStore {
  project: ProjectStore;
  issue: IssueStore;
  sprint: SprintStore;
}

export class CoreRootStore {
  projectRoot: IProjectRootStore;

  constructor() {
    this.projectRoot = {
      project: new ProjectStore(this),
      issue: new IssueStore(this),
      sprint: new SprintStore(this),
    };
  }
}
