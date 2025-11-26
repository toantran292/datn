import { Card } from "./ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const data = [
  { month: "Jan", users: 45, projects: 12, storage: 28 },
  { month: "Feb", users: 52, projects: 15, storage: 35 },
  { month: "Mar", users: 61, projects: 18, storage: 42 },
  { month: "Apr", users: 70, projects: 22, storage: 48 },
  { month: "May", users: 85, projects: 28, storage: 55 },
  { month: "Jun", users: 95, projects: 32, storage: 62 },
  { month: "Jul", users: 112, projects: 38, storage: 71 },
];

export function UsageChart() {
  return (
    <Card className="p-6 border border-border shadow-sm rounded-2xl bg-white">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Usage Overview</h3>
        <p className="text-sm text-muted-foreground">
          Activity trends over the last 7 months
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#9CA3AF"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
            }}
            labelStyle={{ color: "#1A1A1A", fontWeight: 600, marginBottom: "4px" }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#FF8800"
            strokeWidth={3}
            dot={{ fill: "#FF8800", r: 4 }}
            activeDot={{ r: 6 }}
            name="Active Users"
          />
          <Line
            type="monotone"
            dataKey="projects"
            stroke="#00C4AB"
            strokeWidth={3}
            dot={{ fill: "#00C4AB", r: 4 }}
            activeDot={{ r: 6 }}
            name="Projects"
          />
          <Line
            type="monotone"
            dataKey="storage"
            stroke="#8B5CF6"
            strokeWidth={3}
            dot={{ fill: "#8B5CF6", r: 4 }}
            activeDot={{ r: 6 }}
            name="Storage (GB)"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
