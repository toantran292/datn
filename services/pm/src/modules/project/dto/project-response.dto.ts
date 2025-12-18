export class ProjectResponseDto {
  id: string;
  orgId: string;
  identifier: string;
  name: string;
  projectLead: string | null;
  defaultAssignee: string | null;
  createdAt: Date;
  updatedAt: Date;
  sprintIds: string[];
}

export class ProjectLiteResponseDto {
  id: string;
  identifier: string;
  name: string;
  orgId: string;
  projectLead: string | null;
  issueCount: number;
  sprintCount: number;
}

export class ProjectIdentifierAvailabilityResponseDto {
  identifier: string;
  available: boolean;
}
