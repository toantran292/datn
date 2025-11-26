export class SprintResponseDto {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  issueIds: string[];
}
