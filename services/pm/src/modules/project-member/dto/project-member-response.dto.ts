export class ProjectMemberResponseDto {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt: Date;
}

export class UserProjectsResponseDto {
  userId: string;
  projects: {
    id: string;
    projectId: string;
    projectName: string;
    projectIdentifier: string;
    role: string;
  }[];
}
