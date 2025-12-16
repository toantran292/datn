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

  const {
    projects,
    isLoading,
    error,
    createProject,
    deleteProject: deleteProjectFn,
  } = useProjects();

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
      toast.success("Project created", {
        description: `${data.name} has been created successfully.`,
      });
    } catch (error: any) {
      toast.error("Failed to create project", {
        description: error.message || "Please try again.",
      });
      throw error;
    }
  };

  const handleDeleteProject = async (project: ProjectLite) => {
    const success = await deleteProjectFn(project.id);
    if (success) {
      toast.success("Project deleted", {
        description: `${project.name} has been deleted.`,
      });
    } else {
      toast.error("Failed to delete project", {
        description: "Please try again.",
      });
    }
  };

  const handleEditProject = (project: ProjectLite) => {
    // TODO: Implement edit modal
    toast.info("Edit feature coming soon");
  };

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2" style={{ fontWeight: 600 }}>
            Projects
          </h1>
          <p className="text-muted-foreground">
            Manage your projects and their settings
          </p>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search projects..."
              className="pl-10 rounded-xl bg-white border-border h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-sm h-11 lg:w-auto"
          >
            <Plus size={18} className="mr-2" />
            New Project
          </Button>
        </div>

        {/* Projects Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
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
              Failed to load projects
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
              <FolderKanban size={32} className="text-muted-foreground" />
            </div>
            <h3 style={{ fontWeight: 600 }} className="mb-2">
              {searchQuery ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : "Create your first project to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="rounded-xl"
              >
                <Plus size={18} className="mr-2" />
                Create Project
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
