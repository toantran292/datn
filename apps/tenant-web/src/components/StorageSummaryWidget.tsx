import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { HardDrive } from "lucide-react";

interface ProjectBreakdown {
  name: string;
  storage: number;
  color: string;
}

const projectBreakdown: ProjectBreakdown[] = [
  { name: "Marketing Campaign 2025", storage: 32.5, color: "#FF8800" },
  { name: "Product Development", storage: 28.3, color: "#00C4AB" },
  { name: "Customer Success Hub", storage: 10.2, color: "#8B5CF6" }
];

export function StorageSummaryWidget() {
  const totalUsed = projectBreakdown.reduce((sum, p) => sum + p.storage, 0);
  const totalQuota = 100;
  const usagePercent = (totalUsed / totalQuota) * 100;

  return (
    <Card className="p-6 shadow-md rounded-2xl border border-border sticky top-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HardDrive size={20} className="text-primary" />
        </div>
        <h3 style={{ fontWeight: 600 }}>Storage Summary</h3>
      </div>

      {/* Total Storage */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span style={{ fontSize: '2rem', fontWeight: 600, color: '#FF8800' }}>
            {totalUsed.toFixed(1)}
          </span>
          <span className="text-muted-foreground">GB</span>
          <span className="text-muted-foreground">/ {totalQuota} GB</span>
        </div>
        <Progress value={usagePercent} className="h-3 mb-2" />
        <p className="text-sm text-muted-foreground">
          {usagePercent.toFixed(1)}% of quota used
        </p>
      </div>

      {/* Breakdown by Project */}
      <div className="space-y-3 pt-6 border-t border-border">
        <h4 className="text-sm" style={{ fontWeight: 600 }}>Breakdown by Project</h4>
        
        {/* Stacked Bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex">
          {projectBreakdown.map((project, idx) => {
            const percentage = (project.storage / totalUsed) * 100;
            return (
              <div
                key={idx}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: project.color
                }}
                className="h-full"
              />
            );
          })}
        </div>

        {/* Project List */}
        <div className="space-y-2 pt-2">
          {projectBreakdown.map((project, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-muted-foreground text-xs">{project.name}</span>
              </div>
              <span style={{ fontWeight: 600 }}>{project.storage} GB</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
