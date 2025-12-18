"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AnalyticsService } from "@/core/services/analytics/analytics.service";

const analyticsService = new AnalyticsService();

interface CreatedVsResolvedProps {
  projectId: string;
}

export const CreatedVsResolved: React.FC<CreatedVsResolvedProps> = ({ projectId }) => {
  const { data, isLoading, error } = useSWR(
    `created-vs-resolved-${projectId}`,
    () => analyticsService.getCreatedVsResolvedChart(projectId),
    { refreshInterval: 30000 } // Refresh every 30s
  );

  const chartData = useMemo(() => {
    if (!data?.data) return [];

    // Group by date
    const dataMap = new Map<string, { date: string; created: number; completed: number }>();
    
    data.data.forEach((item) => {
      const existing = dataMap.get(item.key);
      if (!existing) {
        dataMap.set(item.key, {
          date: new Date(item.key).toLocaleDateString("vi-VN", { month: "short", day: "numeric" }),
          created: item.label === "created_issues" ? item.count : 0,
          completed: item.label === "completed_issues" ? item.count : 0,
        });
      } else {
        if (item.label === "created_issues") {
          existing.created = item.count;
        } else if (item.label === "completed_issues") {
          existing.completed = item.count;
        }
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => {
      // Sort by date
      const dateA = data.data.find(d => d.key === a.date)?.key || "";
      const dateB = data.data.find(d => d.key === b.date)?.key || "";
      return dateA.localeCompare(dateB);
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[350px] border border-custom-border-200 rounded-lg">
        <div className="text-sm text-custom-text-300">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[350px] border border-custom-border-200 rounded-lg">
        <div className="text-sm text-red-500">Không thể tải dữ liệu analytics</div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] border border-custom-border-200 rounded-lg">
        <p className="text-sm text-custom-text-400">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-custom-text-100">Tạo mới vs Hoàn thành</h3>
        <p className="text-sm text-custom-text-400">30 ngày gần đây</p>
      </div>

      <div className="border border-custom-border-200 rounded-lg p-4 bg-custom-background-100">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1192E8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1192E8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#198038" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#198038" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: "#6b7280" }}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "#6b7280" }}
              stroke="#9ca3af"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#ffffff", 
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "8px 12px"
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="completed"
              name="Hoàn thành"
              stroke="#198038"
              strokeWidth={2}
              fill="url(#colorCompleted)"
            />
            <Area
              type="monotone"
              dataKey="created"
              name="Tạo mới"
              stroke="#1192E8"
              strokeWidth={2}
              fill="url(#colorCreated)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

