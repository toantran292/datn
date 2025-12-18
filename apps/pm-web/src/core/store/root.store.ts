import { IssueStore } from "@/core/store/issue/issue.store";
import { IssueStatusStore } from "@/core/store/issue-status/issue-status.store";
import { ProjectStore } from "@/core/store/project/project.store";
import { SearchStore } from "@/core/store/search/search.store";
import { SprintStore } from "@/core/store/sprint/sprint.store";

export interface IProjectRootStore {
  project: ProjectStore;
  issue: IssueStore;
  issueStatus: IssueStatusStore;
  sprint: SprintStore;
  search: SearchStore;
}

export class CoreRootStore {
  projectRoot: IProjectRootStore;

  constructor() {
    this.projectRoot = {
      project: new ProjectStore(this),
      issue: new IssueStore(this),
      issueStatus: new IssueStatusStore(this),
      sprint: new SprintStore(this),
      search: new SearchStore(this),
    };
  }
}
