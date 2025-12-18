import { Card } from "@/components/ui/card";
import { UserPlus, Upload, Settings, LogOut, FileText, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export type ActivityType = 'FILE_UPLOADED' | 'REPORT_CREATED' | 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'SETTINGS_UPDATED';

export interface Activity {
  id: string;
  type: ActivityType;
  user: { id: string; name: string; avatar?: string };
  description: string;
  metadata: Record<string, any>;
  createdAt: string;
}

type ActivityCategory = "member" | "file" | "settings" | "report" | "left";

interface RecentActivityProps {
  activities?: Activity[];
  isLoading?: boolean;
  hasMore?: boolean;
  onViewAll?: () => void;
}

const activityTypeMap: Record<ActivityType, ActivityCategory> = {
  MEMBER_JOINED: "member",
  MEMBER_LEFT: "left",
  FILE_UPLOADED: "file",
  REPORT_CREATED: "report",
  SETTINGS_UPDATED: "settings"
};

const activityTitleMap: Record<ActivityType, string> = {
  MEMBER_JOINED: "Thành viên mới tham gia",
  MEMBER_LEFT: "Thành viên đã rời đi",
  FILE_UPLOADED: "Đã tải lên tệp",
  REPORT_CREATED: "Đã tạo báo cáo",
  SETTINGS_UPDATED: "Đã cập nhật cài đặt"
};

const activityBadgeMap: Record<ActivityType, string> = {
  MEMBER_JOINED: "Nhóm",
  MEMBER_LEFT: "Nhóm",
  FILE_UPLOADED: "Tệp",
  REPORT_CREATED: "Báo cáo",
  SETTINGS_UPDATED: "Cài đặt"
};

const iconMap: Record<ActivityCategory, LucideIcon> = {
  member: UserPlus,
  left: LogOut,
  file: Upload,
  settings: Settings,
  report: FileText
};

const iconColors: Record<ActivityCategory, { bg: string; color: string }> = {
  member: { bg: "#EEF4FF", color: "#3B82F6" },
  left: { bg: "#FEF2F2", color: "#EF4444" },
  file: { bg: "#FFF4E6", color: "#FF8800" },
  settings: { bg: "#F5F3FF", color: "#8B5CF6" },
  report: { bg: "#ECFDF5", color: "#00C4AB" }
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString();
}

export function RecentActivity({ activities = [], isLoading = false, hasMore = false, onViewAll }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
        <div className="mb-6">
          <h3 style={{ fontWeight: 600 }}>Dòng thời gian hoạt động</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Các hoạt động gần đây trong tổ chức của bạn
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
        <div className="mb-6">
          <h3 style={{ fontWeight: 600 }}>Dòng thời gian hoạt động</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Các hoạt động gần đây trong tổ chức của bạn
          </p>
        </div>
        <div className="py-8 text-center text-muted-foreground">
          <p>Không có hoạt động gần đây</p>
        </div>
      </Card>
    );
  }

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
          const activityType = activityTypeMap[activity.type];
          const Icon = iconMap[activityType];
          const colors = iconColors[activityType];
          const title = activityTitleMap[activity.type];
          const badge = activityBadgeMap[activity.type];

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
                      {title}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs flex-shrink-0 bg-muted border-border"
                    >
                      {badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1.5">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(hasMore || onViewAll) && (
        <button
          onClick={onViewAll}
          className="w-full mt-6 py-2 text-sm text-secondary hover:text-secondary/80 transition-colors rounded-lg hover:bg-secondary/5"
          style={{ fontWeight: 600 }}
        >
          Xem tất cả hoạt động
        </button>
      )}
    </Card>
  );
}
