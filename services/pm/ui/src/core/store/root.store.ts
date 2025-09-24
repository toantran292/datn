import { ProjectStore } from "@/core/store/project/project.store";

export interface IProjectRootStore {
  project: ProjectStore;
}

export class CoreRootStore {
  projectRoot: IProjectRootStore;

  constructor() {
    this.projectRoot = {
      project: new ProjectStore(this),
    };
  }
}
