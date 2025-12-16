export class RecentActivityDto {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  description: string;
  createdAt: string;
}

export class MemberStatsDto {
  total: number;
  owners: number;
  admins: number;
  staff: number;
  guests: number;
}

export class ActivityStatsDto {
  totalActions: number;
  todayActions: number;
  thisWeekActions: number;
  recentActivities: RecentActivityDto[];
}

export class ProjectLiteDto {
  id: string;
  identifier: string;
  name: string;
  projectLead: string | null;
}

export class StorageStatsDto {
  usedBytes: number;
  limitBytes: number;
  usedPercent: number;
}

export class DashboardResponseDto {
  orgId: string;
  orgName: string;
  status: string;
  members: MemberStatsDto;
  activities: ActivityStatsDto;
  projects: {
    total: number;
    items: ProjectLiteDto[];
  };
  storage: StorageStatsDto;
}
