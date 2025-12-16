export class IssueStatusResponseDto {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
