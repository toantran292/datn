import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get created vs resolved issues chart data
   */
  async getCreatedVsResolvedChart(projectId: string, params?: any) {
    const { start_date, end_date } = params || {};

    // Get date range (default last 30 days)
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date
      ? new Date(start_date)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const normalizeStatus = (name?: string | null) => (name || "").trim().toUpperCase();

    // Get all issues in the project
    const issues = await this.prisma.issue.findMany({
      where: {
        projectId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        status: {
          select: {
            name: true,
          },
        },
      },
    });

    // Group by date
    const dataMap = new Map<string, { created: number; completed: number }>();

    // Generate all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dataMap.set(dateKey, { created: 0, completed: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count created issues
    issues.forEach((issue) => {
      const dateKey = issue.createdAt.toISOString().split('T')[0];
      const data = dataMap.get(dateKey);
      if (data) {
        data.created += 1;
      }
    });

    // Count completed issues
    issues.forEach((issue) => {
      const statusName = normalizeStatus(issue.status?.name);
      if (statusName === "DONE" && issue.updatedAt >= startDate && issue.updatedAt <= endDate) {
        const dateKey = issue.updatedAt.toISOString().split("T")[0];
        const data = dataMap.get(dateKey);
        if (data) {
          data.completed += 1;
        }
      }
    });

    // Format response
    const data = Array.from(dataMap.entries())
      .map(([key, value]) => [
        {
          key,
          count: value.created,
          label: 'created_issues',
        },
        {
          key,
          count: value.completed,
          label: 'completed_issues',
        },
      ])
      .flat();

    return { data };
  }

  /**
   * Get issue stats for a project
   */
  async getIssueStats(projectId: string) {
    const [total, completed, inProgress] = await Promise.all([
      // Total issues
      this.prisma.issue.count({
        where: { projectId },
      }),
      // Completed issues
      this.prisma.issue.count({
        where: {
          projectId,
          status: { name: { equals: "DONE", mode: "insensitive" } },
        },
      }),
      // In progress issues
      this.prisma.issue.count({
        where: {
          projectId,
          OR: [
            { status: { name: { equals: "IN PROGRESS", mode: "insensitive" } } },
            { status: { name: { equals: "IN REVIEW", mode: "insensitive" } } },
          ],
        },
      }),
    ]);

    const pending = Math.max(total - completed - inProgress, 0);

    return {
      total,
      completed,
      in_progress: inProgress,
      pending,
    };
  }
}


