"use client";

import { useState } from "react";
import { KPICard } from "./components/KPICard";
import { RecentActivity, Activity } from "./components/RecentActivity";
import { QuickActions } from "./components/QuickActions";
import { RecentFiles } from "./components/RecentFiles";
import { AgentChat } from "./components/AgentChat";
import { InviteMemberModal } from "@/features/members/components/InviteMemberModal";
import { Users, FolderKanban, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "./hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Mock data for recent files
const mockRecentFiles = [
  {
    id: "1",
    name: "Q4-Report-Final.pdf",
    projectId: "p1",
    projectName: "Marketing",
    uploadedBy: { id: "u1", name: "Toan Tran" },
    uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    size: 2.5 * 1024 * 1024,
  },
  {
    id: "2",
    name: "meeting-notes.md",
    projectId: "p2",
    projectName: "Product Dev",
    uploadedBy: { id: "u2", name: "Mai Nguyen" },
    uploadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    size: 45 * 1024,
  },
  {
    id: "3",
    name: "budget-2025.xlsx",
    projectId: "p1",
    projectName: "Marketing",
    uploadedBy: { id: "u3", name: "Huy Le" },
    uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    size: 1.2 * 1024 * 1024,
  },
  {
    id: "4",
    name: "logo-redesign.png",
    projectId: "p3",
    projectName: "Design",
    uploadedBy: { id: "u1", name: "Toan Tran" },
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    size: 850 * 1024,
  },
];

function mapActionToType(action: string): Activity['type'] {
  switch (action) {
    case 'FILE_UPLOAD':
    case 'UPLOAD':
      return 'FILE_UPLOADED';
    case 'REPORT_CREATE':
      return 'REPORT_CREATED';
    case 'MEMBER_JOIN':
    case 'JOIN':
      return 'MEMBER_JOINED';
    case 'MEMBER_LEAVE':
    case 'LEAVE':
      return 'MEMBER_LEFT';
    default:
      return 'SETTINGS_UPDATED';
  }
}

export function OverviewView() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const { data: dashboard, isLoading } = useDashboard();

  const activities: Activity[] = dashboard?.activities.recentActivities.slice(0, 5).map(a => ({
    id: a.id,
    type: mapActionToType(a.action),
    user: { id: a.userId || '', name: a.userEmail || 'Unknown' },
    description: a.description,
    metadata: {},
    createdAt: a.createdAt,
  })) || [];

  const hasMoreActivities = (dashboard?.activities.recentActivities.length || 0) > 5;

  const handleCreateProject = () => {
    toast.success("Create project", {
      description: "Project creation feature coming soon"
    });
  };

  const handleInviteMember = (data: { name: string; email: string; role: string; projects: number[] }) => {
    toast.success(`Invitation sent to ${data.email}`, {
      description: `${data.name} will receive an email to join the organization.`
    });
  };

  const handleViewAllActivity = () => {
    toast.info("View all activity", {
      description: "Activity page coming soon"
    });
  };

  const handleViewAllFiles = () => {
    toast.info("View all files", {
      description: "Redirecting to files page"
    });
  };

  const handleUploadFile = () => {
    toast.info("Upload file", {
      description: "File upload feature coming soon"
    });
  };

  const generateSparkline = (current: number, changePercent: number): number[] => {
    const points = 12;
    const data: number[] = [];
    const startValue = current / (1 + changePercent / 100);
    const step = (current - startValue) / (points - 1);
    for (let i = 0; i < points; i++) {
      data.push(Math.round(startValue + step * i + (Math.random() - 0.5) * step));
    }
    data[points - 1] = current;
    return data;
  };

  const memberCount = dashboard?.members.total || 0;
  const projectCount = dashboard?.projects.total || 0;
  const storagePercent = dashboard?.storage.usedPercent || 0;

  const membersSparkline = dashboard ? generateSparkline(memberCount, 12) : [];
  const projectsSparkline = dashboard ? generateSparkline(projectCount, 8) : [];
  const storageSparkline = dashboard ? generateSparkline(storagePercent, 15) : [];

  return (
    <>
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2" style={{ fontWeight: 600 }}>
            Workspace Dashboard
          </h1>
          <p className="text-muted-foreground">
            Cross-project overview and insights for your workspace
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 border border-border shadow-md rounded-2xl bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                        <Skeleton className="w-12 h-12 rounded-xl" />
                      </div>
                      <Skeleton className="h-10 w-full mb-3" />
                      <Skeleton className="h-4 w-32" />
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  <KPICard
                    title="Members"
                    value={memberCount.toString()}
                    changeType="positive"
                    icon={Users}
                    iconColor="#3B82F6"
                    iconBgColor="#EEF4FF"
                    sparklineData={membersSparkline}
                  />
                  <KPICard
                    title="Projects"
                    value={projectCount.toString()}
                    changeType="positive"
                    icon={FolderKanban}
                    iconColor="#00C4AB"
                    iconBgColor="#ECFDF5"
                    sparklineData={projectsSparkline}
                  />
                  <KPICard
                    title="Storage"
                    value={`${storagePercent}%`}
                    changeType="neutral"
                    icon={HardDrive}
                    iconColor="#FF8800"
                    iconBgColor="#FFF4E6"
                    sparklineData={storageSparkline}
                  />
                </>
              )}
            </div>

            {/* Recent Files */}
            <RecentFiles
              files={mockRecentFiles}
              isLoading={false}
              onViewAll={handleViewAllFiles}
            />

            {/* Activity + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity
                activities={activities}
                isLoading={isLoading}
                hasMore={hasMoreActivities}
                onViewAll={handleViewAllActivity}
              />
              <QuickActions
                onCreateProject={handleCreateProject}
                onInviteMember={() => setInviteModalOpen(true)}
                onUploadFile={handleUploadFile}
              />
            </div>
          </div>

          {/* Right Column: Agent Chat */}
          <div className="xl:col-span-1">
            <div className="sticky top-8">
              <AgentChat />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInviteMember}
      />
    </>
  );
}
