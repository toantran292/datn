import React from "react";
import { useState } from "react";
import { KPICard } from "./KPICard";
import { ProjectUsageBreakdown } from "./ProjectUsageBreakdown";
import { RecentActivity } from "./RecentActivity";
import { QuickActions } from "./QuickActions";
import { InviteMemberModal } from "./InviteMemberModal";
import { FileUploadModal } from "./FileUploadModal";
import { Users, FolderKanban, HardDrive, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function OverviewPage() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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

  // Sparkline data for KPI cards
  const projectsSparkline = [28, 30, 29, 32, 31, 34, 33, 35, 36, 37, 38, 38];
  const membersSparkline = [98, 102, 105, 108, 110, 112, 115, 118, 120, 122, 123, 124];
  const storageSparkline = [52, 54, 56, 58, 60, 62, 64, 66, 68, 69, 70, 71];
  const costSparkline = [2200, 2280, 2350, 2420, 2480, 2550, 2620, 2680, 2720, 2780, 2810, 2847];

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2" style={{ fontWeight: 600 }}>
            Overview Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your organization today.
          </p>
        </div>

        {/* Section 1: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Projects"
            value="38"
            change="+8.6%"
            changeType="positive"
            icon={FolderKanban}
            iconColor="#00C4AB"
            iconBgColor="#ECFDF5"
            sparklineData={projectsSparkline}
          />
          <KPICard
            title="Total Members"
            value="124"
            change="+12.5%"
            changeType="positive"
            icon={Users}
            iconColor="#3B82F6"
            iconBgColor="#EEF4FF"
            sparklineData={membersSparkline}
          />
          <KPICard
            title="Storage Used"
            value="71 GB"
            change="+15.2%"
            changeType="neutral"
            icon={HardDrive}
            iconColor="#FF8800"
            iconBgColor="#FFF4E6"
            sparklineData={storageSparkline}
          />
          <KPICard
            title="Monthly Cost"
            value="$2,847"
            change="+6.3%"
            changeType="neutral"
            icon={DollarSign}
            iconColor="#8B5CF6"
            iconBgColor="#F5F3FF"
            sparklineData={costSparkline}
          />
        </div>

        {/* Section 2: Project Usage Breakdown */}
        <div className="mb-8">
          <ProjectUsageBreakdown />
        </div>

        {/* Section 3 & 4: Activity Timeline + Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RecentActivity />
          </div>
          <div>
            <QuickActions
              onCreateProject={handleCreateProject}
              onInviteMember={() => setInviteModalOpen(true)}
              onUploadFile={() => setUploadModalOpen(true)}
            />
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
