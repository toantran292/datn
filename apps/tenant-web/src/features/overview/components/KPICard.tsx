import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  sparklineData?: number[];
}

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "#FF8800",
  iconBgColor = "#FFF4E6",
  sparklineData = [20, 25, 22, 30, 28, 35, 32, 38, 42, 40, 45, 48]
}: KPICardProps) {
  const chartData = sparklineData.map((value) => ({ value }));

  const getSparklineColor = () => {
    if (changeType === "positive") return "#00C4AB";
    if (changeType === "negative") return "#d4183d";
    return "#6B7280";
  };

  return (
    <Card className="p-6 border border-border shadow-md hover:shadow-lg transition-all rounded-2xl bg-white group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <h3 className="mb-1" style={{ fontSize: '2rem', fontWeight: 600 }}>{value}</h3>
        </div>
        <div
          className="p-3 rounded-xl transition-transform group-hover:scale-110"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon size={24} style={{ color: iconColor }} />
        </div>
      </div>

      <div className="mb-3 -mx-2" style={{ height: '40px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={getSparklineColor()}
              strokeWidth={2}
              dot={false}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {change && (
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm ${
              changeType === "positive"
                ? "text-secondary"
                : changeType === "negative"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
            style={{ fontWeight: 600 }}
          >
            {change}
          </span>
          <span className="text-xs text-muted-foreground">so với tháng trước</span>
        </div>
      )}
    </Card>
  );
}
