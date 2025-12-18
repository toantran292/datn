"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, MessageSquare, Shield } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserProfile } from "@uts/design-system/ui";
import { useAppHeaderContext } from "@uts/design-system/ui";

interface NotificationPreference {
  email: boolean;
  inApp: boolean;
}

interface NotificationSettings {
  taskAssigned: NotificationPreference;
  taskUpdated: NotificationPreference;
  mentions: NotificationPreference;
  projectUpdates: NotificationPreference;
}

const defaultNotificationSettings: NotificationSettings = {
  taskAssigned: { email: true, inApp: true },
  taskUpdated: { email: false, inApp: true },
  mentions: { email: true, inApp: true },
  projectUpdates: { email: false, inApp: true },
};

const notificationLabels: Record<keyof NotificationSettings, { title: string; description: string }> = {
  taskAssigned: {
    title: "Công việc được giao",
    description: "Khi một công việc được giao cho bạn",
  },
  taskUpdated: {
    title: "Công việc được cập nhật",
    description: "Khi một công việc bạn được giao được cập nhật",
  },
  mentions: {
    title: "Được nhắc đến",
    description: "Khi ai đó nhắc đến bạn trong một bình luận",
  },
  projectUpdates: {
    title: "Cập nhật dự án",
    description: "Cập nhật về các dự án bạn là thành viên",
  },
};

// Custom Toggle Switch component
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${checked ? 'bg-[#FF8800]' : 'bg-gray-200'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0
          transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export function UserSettings() {
  const { email, roles, isLoading } = useCurrentUser();
  const { apiBaseUrl } = useAppHeaderContext();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile({ apiBaseUrl });
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (
    key: keyof NotificationSettings,
    type: keyof NotificationPreference
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: !prev[key][type],
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Đã lưu cài đặt", {
      description: "Tùy chọn thông báo của bạn đã được cập nhật.",
    });
  };

  const loading = isLoading || isProfileLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-6 border border-border shadow-sm rounded-xl bg-white">
            <div className="flex flex-col items-center text-center">
              <Skeleton className="w-24 h-24 rounded-full mb-4" />
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-48 mb-3" />
              <Skeleton className="h-6 w-20" />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="p-6 border border-border shadow-sm rounded-xl bg-white">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const displayEmail = profile?.email || email || "Not available";
  const displayName = profile?.displayName ||
    (profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.first_name || displayEmail.split("@")[0] || "User");
  const avatarUrl = profile?.avatarUrl;
  const nameInitial = displayName.charAt(0).toUpperCase();
  const primaryRole = roles[0]?.toLowerCase() || "member";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Profile Card */}
      <div className="lg:col-span-1">
        <Card className="p-6 border border-border shadow-sm rounded-xl bg-white">
          {/* Avatar with Name */}
          <div className="flex flex-col items-center text-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover mb-4 shadow-lg border-4 border-white"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FF8800 0%, #FFB366 100%)' }}
              >
                <span className="text-3xl font-bold text-white">{nameInitial}</span>
              </div>
            )}
            <h3 className="font-semibold text-lg text-foreground">{displayName}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{displayEmail}</p>
            <Badge
              variant="outline"
              className="mt-3 capitalize px-3 py-1"
            >
              <Shield size={12} className="mr-1.5" />
              {primaryRole}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Right Column - Notification Preferences */}
      <div className="lg:col-span-2">
        <Card className="border border-border shadow-sm rounded-xl bg-white overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 136, 0, 0.1)' }}
              >
                <Bell size={20} style={{ color: '#FF8800' }} />
              </div>
              <div>
                <h3 className="font-semibold text-base">Tùy chọn thông báo</h3>
                <p className="text-sm text-muted-foreground">
                  Chọn cách bạn muốn được thông báo
                </p>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="px-6 py-3 bg-gray-50 border-b border-border">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-6">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Loại thông báo
                </span>
              </div>
              <div className="col-span-3 text-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Mail size={12} />
                  Email
                </div>
              </div>
              <div className="col-span-3 text-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <MessageSquare size={12} />
                  Trong ứng dụng
                </div>
              </div>
            </div>
          </div>

          {/* Notification Items */}
          <div className="divide-y divide-border">
            {(Object.keys(notificationLabels) as (keyof NotificationSettings)[]).map((key) => (
              <div
                key={key}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <p className="font-medium text-sm">{notificationLabels[key].title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {notificationLabels[key].description}
                    </p>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <ToggleSwitch
                      checked={notifications[key].email}
                      onChange={() => handleToggle(key, "email")}
                    />
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <ToggleSwitch
                      checked={notifications[key].inApp}
                      onChange={() => handleToggle(key, "inApp")}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Tùy chọn được lưu cục bộ cho đến khi có hỗ trợ từ máy chủ.
              </p>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                style={{ backgroundColor: '#FF8800' }}
                className="text-white hover:opacity-90"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
