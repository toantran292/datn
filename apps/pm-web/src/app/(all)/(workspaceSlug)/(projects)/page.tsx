"use client";

import { observer } from "mobx-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus, ArrowRight, Calendar, Users, CheckCircle2, Sparkles, Settings } from "lucide-react";
import { useProjects } from "@/core/hooks/use-projects";
import { useAppHeaderContext } from "@uts/design-system/ui";
import { CreateProjectModal } from "@/core/components/project/create-project-modal";

const WorkspaceDashboardPage = observer(() => {
  const router = useRouter();
  const { projects, isLoading, mutate } = useProjects();
  const { workspaceSlug, auth, currentWorkspaceId, apiBaseUrl } = useAppHeaderContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isAdminOrOwner = auth?.roles?.some((role) =>
    ["ADMIN", "OWNER"].includes(role.toUpperCase())
  ) ?? false;

  const handleProjectClick = (projectId: string) => {
    const path = workspaceSlug ? `/${workspaceSlug}/project/${projectId}` : `/project/${projectId}`;
    router.push(path);
  };

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = () => {
    mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-custom-text-300">Đang tải không gian làm việc...</div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto bg-custom-background-100">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* Hero Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-custom-text-100 mb-2">
                Chào mừng trở lại{auth?.user_data?.first_name ? `, ${auth.user_data.first_name}` : ""}!
              </h1>
              <p className="text-custom-text-300">
                Quản lý dự án và theo dõi tiến độ của bạn
              </p>
            </div>
            {isAdminOrOwner && (
              <button
                type="button"
                onClick={handleCreateProject}
                className="flex items-center gap-2 px-5 py-2.5 bg-custom-primary text-white rounded-lg hover:bg-custom-primary/90 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Dự án mới</span>
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-custom-background-90 border border-custom-border-200 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-custom-primary/10 rounded-lg">
                  <FolderKanban className="h-5 w-5 text-custom-primary" />
                </div>
                <div>
                  <p className="text-sm text-custom-text-300">Tổng số dự án</p>
                  <p className="text-2xl font-bold text-custom-text-100">{projects.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-custom-background-90 border border-custom-border-200 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-custom-text-300">Dự án hoạt động</p>
                  <p className="text-2xl font-bold text-custom-text-100">{projects.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-custom-background-90 border border-custom-border-200 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-custom-text-300">Thành viên</p>
                  <p className="text-2xl font-bold text-custom-text-100">-</p>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-custom-text-100">
                {projects.length > 0 ? "Dự án của bạn" : "Bắt đầu với dự án đầu tiên"}
              </h2>
            </div>

            {projects.length === 0 ? (
              <div className="bg-custom-background-90 border-2 border-dashed border-custom-border-200 rounded-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="mb-4 inline-flex p-3 bg-custom-background-80 rounded-lg">
                    <FolderKanban className="h-8 w-8 text-custom-text-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-custom-text-100 mb-2">
                    Chưa có dự án nào
                  </h3>
                  <p className="text-custom-text-300 mb-6">
                    {isAdminOrOwner
                      ? "Tạo dự án đầu tiên để bắt đầu quản lý công việc của bạn"
                      : "Chưa có dự án nào. Liên hệ với quản trị viên để tạo dự án"}
                  </p>
                  {isAdminOrOwner && (
                    <button
                      type="button"
                      onClick={handleCreateProject}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-custom-primary text-white rounded-lg hover:bg-custom-primary/90 transition-colors font-medium"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Tạo dự án đầu tiên</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleProjectClick(project.id)}
                    className="group bg-custom-background-90 border border-custom-border-200 rounded-lg p-5 hover:border-custom-primary hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {project.logo_props?.in_use === "emoji" && project.logo_props.emoji?.value ? (
                          <span className="text-3xl">{project.logo_props.emoji.value}</span>
                        ) : (
                          <div className="p-2 bg-custom-background-80 rounded-lg">
                            <FolderKanban className="h-5 w-5 text-custom-text-300" />
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-custom-text-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <h3 className="text-base font-semibold text-custom-text-100 mb-1 line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-xs text-custom-text-300 mb-3">
                      {project.identifier}
                    </p>

                    {project.description && (
                      <p className="text-sm text-custom-text-300 line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-custom-text-400 pt-3 border-t border-custom-border-200">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : "N/A"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {currentWorkspaceId && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          workspaceSlug={workspaceSlug || ''}
          onSuccess={handleProjectCreated}
        />
      )}
    </>
  );
});

export default WorkspaceDashboardPage;
