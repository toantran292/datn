"use client";

import useSWR from "swr";
import { CheckCircle2, Circle, Clock, ListTodo } from "lucide-react";
import { AnalyticsService } from "@/core/services/analytics/analytics.service";

const analyticsService = new AnalyticsService();

interface IssueStatsProps {
  projectId: string;
}

export const IssueStats: React.FC<IssueStatsProps> = ({ projectId }) => {
  const { data, isLoading, error } = useSWR(
    `issue-stats-${projectId}`,
    () => analyticsService.getIssueStats(projectId),
    { refreshInterval: 30000 }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-custom-border-200 rounded-lg p-4 animate-pulse">
            <div className="h-4 w-20 bg-custom-background-80 rounded mb-2" />
            <div className="h-8 w-12 bg-custom-background-80 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border border-custom-border-200 rounded-lg p-4 text-center">
        <p className="text-sm text-red-500">Không thể tải thống kê</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Tổng số",
      value: data.total,
      icon: ListTodo,
      color: "text-custom-text-300",
      bg: "bg-custom-background-80",
    },
    {
      label: "Đang làm",
      value: data.in_progress,
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Hoàn thành",
      value: data.completed,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Chờ xử lý",
      value: data.pending,
      icon: Circle,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="border border-custom-border-200 rounded-lg p-4 bg-custom-background-100 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-custom-text-400">{stat.label}</p>
              <p className="text-2xl font-semibold text-custom-text-100">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};



