import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Users, HardDrive, DollarSign, Clock, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ProjectUsage {
  id: number;
  name: string;
  members: number;
  storage: number;
  cost: number;
  lastUpdated: string;
  color: string;
}

interface ProjectUsageDrawerProps {
  project: ProjectUsage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockTrendData = [
  { month: 'Jun', members: 8, storage: 15.2, cost: 450 },
  { month: 'Jul', members: 9, storage: 18.5, cost: 520 },
  { month: 'Aug', members: 10, storage: 22.3, cost: 650 },
  { month: 'Sep', members: 11, storage: 26.8, cost: 780 },
  { month: 'Oct', members: 12, storage: 32.5, cost: 892 }
];

export function ProjectUsageDrawer({ project, open, onOpenChange }: ProjectUsageDrawerProps) {
  if (!project) return null;

  const storageQuota = 50;
  const storagePercent = (project.storage / storageQuota) * 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${project.color}15` }}
            >
              <span style={{ fontWeight: 600, color: project.color }}>
                {project.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <SheetTitle style={{ fontWeight: 600 }}>{project.name}</SheetTitle>
              <SheetDescription>Project usage details and trends</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Users size={16} className="text-secondary" />
                </div>
                <span className="text-sm text-muted-foreground">Members</span>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{project.members}</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign size={16} className="text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Cost</span>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FF8800' }}>
                ${project.cost}
              </p>
            </div>
          </div>

          {/* Storage Usage */}
          <div className="p-4 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive size={18} className="text-muted-foreground" />
                <span style={{ fontWeight: 600 }}>Storage Usage</span>
              </div>
              <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20">
                {storagePercent.toFixed(0)}% used
              </Badge>
            </div>
            <div className="mb-2">
              <div className="flex items-baseline gap-2 mb-2">
                <span style={{ fontSize: '1.75rem', fontWeight: 600 }}>{project.storage}</span>
                <span className="text-muted-foreground">GB / {storageQuota} GB</span>
              </div>
              <Progress value={storagePercent} className="h-2" />
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 rounded-xl bg-muted/30">
            <Clock size={16} />
            <span>Last updated {project.lastUpdated}</span>
          </div>

          {/* Trend Chart */}
          <div className="pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-secondary" />
              <h4 style={{ fontWeight: 600 }}>Usage Trends</h4>
            </div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    stroke="#6B7280"
                    style={{ fontSize: '0.75rem' }}
                  />
                  <YAxis stroke="#6B7280" style={{ fontSize: '0.75rem' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="members"
                    stroke="#00C4AB"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Members"
                  />
                  <Line
                    type="monotone"
                    dataKey="storage"
                    stroke="#FF8800"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Storage (GB)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-2xl mb-1" style={{ fontWeight: 600, color: '#00C4AB' }}>+4</p>
              <p className="text-xs text-muted-foreground">New members</p>
              <p className="text-xs text-muted-foreground">this month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl mb-1" style={{ fontWeight: 600, color: '#FF8800' }}>+17GB</p>
              <p className="text-xs text-muted-foreground">Storage added</p>
              <p className="text-xs text-muted-foreground">this month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl mb-1" style={{ fontWeight: 600, color: '#8B5CF6' }}>+24%</p>
              <p className="text-xs text-muted-foreground">Cost increase</p>
              <p className="text-xs text-muted-foreground">vs last month</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
