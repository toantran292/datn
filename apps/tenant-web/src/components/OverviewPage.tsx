import React from "react";
import { useState } from "react";
import { KPICard } from "./KPICard";
import { RecentActivity } from "./RecentActivity";
import { QuickActions } from "./QuickActions";
import { RecentFiles } from "./RecentFiles";
import { AgentChat } from "./AgentChat";
import { InviteMemberModal } from "./InviteMemberModal";
import { FileUploadModal } from "./FileUploadModal";
import { Users, FolderKanban, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStats } from "../hooks/useWorkspaceStats";
import { useWorkspaceActivities } from "../hooks/useWorkspaceActivities";
import { Skeleton } from "./ui/skeleton";
import { Card } from "./ui/card";

// Mock data for recent files (TODO: replace with API)
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

export function OverviewPage() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { stats, isLoading: statsLoading } = useWorkspaceStats();
  const { activities, isLoading: activitiesLoading, hasMore } = useWorkspaceActivities(5);

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

  // Generate sparkline data based on trend
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

  const membersSparkline = stats ? generateSparkline(stats.memberCount, 12) : [];
  const projectsSparkline = generateSparkline(5, 8); // Mock project count
  const storageSparkline = generateSparkline(45, 15); // Mock storage

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

        {/* Main Layout: Left content + Right Agent Chat */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Stats, Files, Activity, Actions */}
          <div className="xl:col-span-2 space-y-6">
            {/* Section 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statsLoading ? (
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
                    value={stats?.memberCount.toString() || "0"}
                    changeType="positive"
                    icon={Users}
                    iconColor="#3B82F6"
                    iconBgColor="#EEF4FF"
                    sparklineData={membersSparkline}
                  />
                  <KPICard
                    title="Projects"
                    value="5"
                    changeType="positive"
                    icon={FolderKanban}
                    iconColor="#00C4AB"
                    iconBgColor="#ECFDF5"
                    sparklineData={projectsSparkline}
                  />
                  <KPICard
                    title="Storage"
                    value="45%"
                    changeType="neutral"
                    icon={HardDrive}
                    iconColor="#FF8800"
                    iconBgColor="#FFF4E6"
                    sparklineData={storageSparkline}
                  />
                </>
              )}
            </div>

            {/* Section 2: Recent Files */}
            <RecentFiles
              files={mockRecentFiles}
              isLoading={false}
              onViewAll={handleViewAllFiles}
            />

            {/* Section 3: Activity + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity
                activities={activities}
                isLoading={activitiesLoading}
                hasMore={hasMore}
                onViewAll={handleViewAllActivity}
              />
              <QuickActions
                onCreateProject={handleCreateProject}
                onInviteMember={() => setInviteModalOpen(true)}
                onUploadFile={() => setUploadModalOpen(true)}
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
      <FileUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />
    </>
  );
}
