"use client";

import { useState } from "react";
import { KPICard } from "./components/KPICard";
import { RecentActivity, Activity } from "./components/RecentActivity";
import { QuickActions } from "./components/QuickActions";
import { RecentFiles } from "./components/RecentFiles";
import { AgentChat } from "./components/AgentChat";
import { MyTasks } from "./components/MyTasks";
import { InviteMemberModal } from "@/features/members/components/InviteMemberModal";
import { CreateProjectModal } from "@/features/projects/components/CreateProjectModal";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { Users, FolderKanban, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "./hooks/useDashboard";
import { useRecentFiles } from "./hooks/useRecentFiles";
import { useMyTasks } from "./hooks/useMyTasks";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useAppHeaderContext } from "@uts/design-system/ui";

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
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);

  const { auth } = useAppHeaderContext();
  const { data: dashboard, isLoading, refetch: refetchDashboard } = useDashboard();
  const { createProject } = useProjects();
  const { files: recentFiles, isLoading: isLoadingFiles } = useRecentFiles(5);
  const { tasks: myTasks, isLoading: isLoadingTasks } = useMyTasks();

  // Check if user is admin or owner
  const isAdminOrOwner = auth?.roles?.some((role) =>
    ["ADMIN", "OWNER"].includes(role.toUpperCase())
  ) ?? false;

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
    setCreateProjectModalOpen(true);
  };

  const handleCreateProjectSubmit = async (data: { name: string; identifier?: string; description?: string }) => {
    const project = await createProject(data);
    if (project) {
      toast.success("Project created", {
        description: `"${project.name}" has been created successfully.`,
      });
      refetchDashboard();
      // Navigate to project page
      window.location.href = `/projects/${project.id}/board`;
    }
  };

  const handleInviteMember = (data: { email: string; role: string }) => {
    toast.success(`Invitation sent to ${data.email}`, {
      description: `They will receive an email to join the organization.`
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

  const handleTaskClick = (task: any) => {
    // Navigate to project board with the task
    if (task.project?.id) {
      window.location.href = `/projects/${task.project.id}/board`;
    }
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

  // Member View - Focus on assigned tasks
  if (!isAdminOrOwner) {
    return (
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2" style={{ fontWeight: 600 }}>
            My Workspace
          </h1>
          <p className="text-muted-foreground">
            Your tasks and recent activity
          </p>
        </div>

        {/* Main Layout for Members */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* My Tasks - Primary focus for members */}
            <MyTasks
              tasks={myTasks}
              isLoading={isLoadingTasks}
              onTaskClick={handleTaskClick}
            />

            {/* Recent Files */}
            <RecentFiles
              files={recentFiles}
              isLoading={isLoadingFiles}
              onViewAll={handleViewAllFiles}
            />

            {/* Activity */}
            <RecentActivity
              activities={activities}
              isLoading={isLoading}
              hasMore={hasMoreActivities}
              onViewAll={handleViewAllActivity}
            />
          </div>

          {/* Right Column: Agent Chat */}
          <div className="xl:col-span-1">
            <div className="sticky top-8">
              <AgentChat />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin/Owner View - Full dashboard with KPIs and Quick Actions
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
              files={recentFiles}
              isLoading={isLoadingFiles}
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
      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={setCreateProjectModalOpen}
        onSubmit={handleCreateProjectSubmit}
      />
    </>
  );
}
