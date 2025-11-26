import { Shield, UserPlus, FolderPlus, Settings, Clock } from "lucide-react";
import { Badge } from "./ui/badge";

interface ActivityItem {
  id: number;
  type: "role_change" | "permission_change" | "project_added" | "settings_updated";
  title: string;
  description: string;
  timestamp: string;
}

const activities: ActivityItem[] = [
  {
    id: 1,
    type: "role_change",
    title: "Role changed",
    description: "Tenant role changed from Member to Admin",
    timestamp: "2 hours ago"
  },
  {
    id: 2,
    type: "project_added",
    title: "Added to project",
    description: "Assigned as Editor to Marketing Campaign 2025",
    timestamp: "1 day ago"
  },
  {
    id: 3,
    type: "permission_change",
    title: "Permissions updated",
    description: "Granted 'Manage Billing' permission",
    timestamp: "3 days ago"
  },
  {
    id: 4,
    type: "project_added",
    title: "Added to project",
    description: "Assigned as Viewer to Product Development",
    timestamp: "5 days ago"
  },
  {
    id: 5,
    type: "settings_updated",
    title: "Profile updated",
    description: "Email address changed",
    timestamp: "1 week ago"
  }
];

const iconMap = {
  role_change: Shield,
  permission_change: Settings,
  project_added: FolderPlus,
  settings_updated: Settings
};

const colorMap = {
  role_change: { bg: "#EEF4FF", color: "#3B82F6" },
  permission_change: { bg: "#F5F3FF", color: "#8B5CF6" },
  project_added: { bg: "#ECFDF5", color: "#00C4AB" },
  settings_updated: { bg: "#F3F4F6", color: "#6B7280" }
};

export function MemberActivityLog() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 style={{ fontWeight: 600 }}>Activity Log</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Recent permission and role changes
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Last 30 days
        </Badge>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          const colors = colorMap[activity.type];

          return (
            <div key={activity.id} className="relative">
              {index < activities.length - 1 && (
                <div
                  className="absolute left-5 top-12 w-0.5 bg-border"
                  style={{ height: 'calc(100% - 12px)' }}
                />
              )}
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                <div
                  className="p-2.5 rounded-xl flex-shrink-0 relative z-10"
                  style={{ backgroundColor: colors.bg }}
                >
                  <Icon size={16} style={{ color: colors.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p style={{ fontWeight: 600 }} className="text-sm">
                      {activity.title}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1.5">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full py-2 text-sm text-secondary hover:text-secondary/80 transition-colors rounded-lg hover:bg-secondary/5" style={{ fontWeight: 600 }}>
        View full history →
      </button>
    </div>
  );
}
