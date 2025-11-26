import { SprintStatus } from "@prisma/client";

export class SprintResponseDto {
  id: string;
  projectId: string;
  name: string;
  status: SprintStatus;
  goal: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  issueIds: string[];
}
