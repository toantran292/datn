"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FolderKanban } from "lucide-react";
import { ProjectCard } from "./components/ProjectCard";
import { CreateProjectModal } from "./components/CreateProjectModal";
import { DeleteProjectDialog } from "./components/DeleteProjectDialog";
import { useProjects, type ProjectLite, type CreateProjectData } from "./hooks/useProjects";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useAppHeaderContext } from "@uts/design-system/ui";

function ProjectsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-5 border border-border shadow-md rounded-2xl bg-white">
          <div className="flex items-start gap-3 mb-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ProjectsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteProject, setDeleteProject] = useState<ProjectLite | null>(null);

  const { auth } = useAppHeaderContext();
  const {
    projects,
    isLoading,
    error,
    createProject,
    deleteProject: deleteProjectFn,
  } = useProjects();

  // Check if user is admin or owner
  const isAdminOrOwner = auth?.roles?.some((role) =>
    ["ADMIN", "OWNER"].includes(role.toUpperCase())
  ) ?? false;

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.identifier.toLowerCase().includes(query)
    );
  });

  const handleCreateProject = async (data: CreateProjectData) => {
    try {
      await createProject(data);
      toast.success("Đã tạo dự án", {
        description: `${data.name} đã được tạo thành công.`,
      });
    } catch (error: any) {
      toast.error("Không thể tạo dự án", {
        description: error.message || "Vui lòng thử lại.",
      });
      throw error;
    }
  };

  const handleDeleteProject = async (project: ProjectLite) => {
    const success = await deleteProjectFn(project.id);
    if (success) {
      toast.success("Đã xóa dự án", {
        description: `${project.name} đã được xóa.`,
      });
    } else {
      toast.error("Không thể xóa dự án", {
        description: "Vui lòng thử lại.",
      });
    }
  };

  const handleEditProject = (project: ProjectLite) => {
    // TODO: Implement edit modal
    toast.info("Tính năng chỉnh sửa sắp có");
  };

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2" style={{ fontWeight: 600 }}>
            Dự án
          </h1>
          <p className="text-muted-foreground">
            Quản lý các dự án và cài đặt của bạn
          </p>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Tìm kiếm dự án..."
              className="pl-10 rounded-xl bg-white border-border h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isAdminOrOwner && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-sm h-11 lg:w-auto"
            >
              <Plus size={18} className="mr-2" />
              Dự án mới
            </Button>
          )}
        </div>

        {/* Projects Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredProjects.length} dự án
          </p>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <ProjectsLoadingSkeleton />
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <FolderKanban size={32} className="text-destructive" />
            </div>
            <h3 style={{ fontWeight: 600 }} className="mb-2">
              Không thể tải dự án
            </h3>
            <p className="text-muted-foreground mb-6">{error}</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onDelete={setDeleteProject}
                showActions={isAdminOrOwner}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
              <FolderKanban size={32} className="text-muted-foreground" />
            </div>
            <h3 style={{ fontWeight: 600 }} className="mb-2">
              {searchQuery ? "Không tìm thấy dự án" : "Chưa có dự án nào"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Hãy điều chỉnh từ khóa tìm kiếm"
                : "Tạo dự án đầu tiên để bắt đầu"}
            </p>
            {!searchQuery && isAdminOrOwner && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="rounded-xl"
              >
                <Plus size={18} className="mr-2" />
                Tạo dự án
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateProject}
      />

      {/* Delete Project Dialog */}
      <DeleteProjectDialog
        project={deleteProject}
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
        onConfirm={handleDeleteProject}
      />
    </>
  );
}
