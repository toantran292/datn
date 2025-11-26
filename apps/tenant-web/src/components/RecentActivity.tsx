import { Card } from "./ui/card";
import { UserPlus, Receipt, Upload, Settings, FolderPlus, Mail } from "lucide-react";
import { Badge } from "./ui/badge";

interface Activity {
  id: number;
  type: "member" | "invoice" | "file" | "settings" | "project" | "invite";
  title: string;
  description: string;
  time: string;
  badge?: string;
}

const activities: Activity[] = [
  {
    id: 1,
    type: "member",
    title: "New member joined",
    description: "Sarah Chen joined Marketing Campaign 2025",
    time: "2 hours ago",
    badge: "Team"
  },
  {
    id: 2,
    type: "invoice",
    title: "Invoice paid",
    description: "Monthly subscription payment of $2,847 processed",
    time: "5 hours ago",
    badge: "Billing"
  },
  {
    id: 3,
    type: "file",
    title: "File uploaded",
    description: "Q4-Presentation.pdf uploaded to Marketing Campaign 2025",
    time: "8 hours ago",
    badge: "Files"
  },
  {
    id: 4,
    type: "project",
    title: "New project created",
    description: "Customer Success Hub workspace initialized",
    time: "Yesterday",
    badge: "Projects"
  },
  {
    id: 5,
    type: "invite",
    title: "Invitation sent",
    description: "Michael Park invited to join the organization",
    time: "Yesterday",
    badge: "Team"
  },
  {
    id: 6,
    type: "settings",
    title: "Settings updated",
    description: "Billing email changed to billing@acmecorp.com",
    time: "2 days ago",
    badge: "Settings"
  }
];

const iconMap = {
  member: UserPlus,
  invoice: Receipt,
  file: Upload,
  settings: Settings,
  project: FolderPlus,
  invite: Mail
};

const iconColors = {
  member: { bg: "#EEF4FF", color: "#3B82F6" },
  invoice: { bg: "#F0FDF4", color: "#00C4AB" },
  file: { bg: "#FFF4E6", color: "#FF8800" },
  settings: { bg: "#F5F3FF", color: "#8B5CF6" },
  project: { bg: "#ECFDF5", color: "#00C4AB" },
  invite: { bg: "#FFF4E6", color: "#FF8800" }
};

export function RecentActivity() {
  return (
    <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
      <div className="mb-6">
        <h3 style={{ fontWeight: 600 }}>Activity Timeline</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Recent actions across your organization
        </p>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          const colors = iconColors[activity.type];

          return (
            <div key={activity.id} className="relative">
              {index < activities.length - 1 && (
                <div
                  className="absolute left-5 top-11 w-0.5 h-full bg-border"
                  style={{ height: 'calc(100% + 1rem)' }}
                />
              )}
              <div className="flex items-start gap-4 group cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-2 rounded-lg transition-colors">
                <div
                  className="p-2.5 rounded-xl mt-0.5 flex-shrink-0 relative z-10 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: colors.bg }}
                >
                  <Icon size={18} style={{ color: colors.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p style={{ fontWeight: 600 }} className="text-sm">
                      {activity.title}
                    </p>
                    {activity.badge && (
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0 bg-muted border-border"
                      >
                        {activity.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1.5">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-6 py-2 text-sm text-secondary hover:text-secondary/80 transition-colors rounded-lg hover:bg-secondary/5" style={{ fontWeight: 600 }}>
        View all activity →
      </button>
    </Card>
  );
}
