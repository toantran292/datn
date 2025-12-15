import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { DashboardResponseDto, StorageStatsDto } from './dto/dashboard.dto';

// Default storage limit: 10 GB (can be configured via env)
const DEFAULT_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly identityBaseUrl: string;
  private readonly pmBaseUrl: string;
  private readonly fileStorageBaseUrl: string;
  private readonly storageLimitBytes: number;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.identityBaseUrl = this.config.get('IDENTITY_BASE_URL', 'http://identity:3000');
    this.pmBaseUrl = this.config.get('PM_BASE_URL', 'http://pm:3000');
    this.fileStorageBaseUrl = this.config.get('FILE_STORAGE_URL', 'http://file-storage-api:3000');
    this.storageLimitBytes = this.config.get('STORAGE_LIMIT_BYTES', DEFAULT_STORAGE_LIMIT_BYTES);
  }

  async getDashboard(orgId: string): Promise<DashboardResponseDto> {
    // Call identity, pm, and file-storage services in parallel
    const [identityStats, projects, storageUsed] = await Promise.all([
      this.fetchIdentityDashboard(orgId),
      this.fetchProjects(orgId),
      this.fetchStorageUsage(orgId),
    ]);

    const storage: StorageStatsDto = {
      usedBytes: storageUsed,
      limitBytes: this.storageLimitBytes,
      usedPercent: Math.round((storageUsed / this.storageLimitBytes) * 100),
    };

    return {
      orgId: identityStats.orgId,
      orgName: identityStats.orgName,
      status: identityStats.status,
      members: identityStats.members,
      activities: identityStats.activities,
      projects: {
        total: projects.length,
        items: projects.slice(0, 5), // Only return top 5 for dashboard
      },
      storage,
    };
  }

  private async fetchIdentityDashboard(orgId: string) {
    const url = `${this.identityBaseUrl}/orgs/${orgId}/dashboard`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-Internal-Call': 'bff' },
        }),
      );
      return res.data;
    } catch (err) {
      this.logger.error(`Failed to fetch identity dashboard: ${err.message}`);
      // Return default stats on error
      return {
        orgId,
        orgName: '',
        status: 'UNKNOWN',
        members: { total: 0, owners: 0, admins: 0, staff: 0, guests: 0 },
        activities: { totalActions: 0, todayActions: 0, thisWeekActions: 0, recentActivities: [] },
      };
    }
  }

  private async fetchProjects(orgId: string) {
    const url = `${this.pmBaseUrl}/api/projects`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );
      return res.data || [];
    } catch (err) {
      this.logger.error(`Failed to fetch projects: ${err.message}`);
      return [];
    }
  }

  private async fetchStorageUsage(orgId: string): Promise<number> {
    const url = `${this.fileStorageBaseUrl}/files/storage/usage`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );
      return res.data?.data?.usedBytes || 0;
    } catch (err) {
      this.logger.error(`Failed to fetch storage usage: ${err.message}`);
      // Return 0 on error (file-storage may not have this endpoint yet)
      return 0;
    }
  }
}
