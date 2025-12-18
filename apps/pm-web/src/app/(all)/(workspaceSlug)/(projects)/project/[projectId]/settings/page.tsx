"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { observer } from "mobx-react";
import { Settings, Save, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useProject } from "@/core/hooks/store/use-project";
import { ProjectTabs } from "@/core/components/project/project-tabs";
import axios from "axios";

type ProjectMember = {
  id: string;
  userId: string;
  projectId: string;
  role: string;
  createdAt: string;
};

export default observer(function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const workspaceSlug = params?.workspaceSlug as string;

  const { currentProject, updateProject, fetchProjectDetails, deleteProject } = useProject();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    projectLead: "",
    defaultAssignee: "",
    description: "",
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Fetch project members
  const fetchProjectMembers = async (projectId: string) => {
    try {
      const response = await axios.get(`/api/project-members/projects/${projectId}`);
      setProjectMembers(response?.data || []);
    } catch (error) {
      console.error("Failed to fetch project members:", error);
      setProjectMembers([]);
    }
  };

  useEffect(() => {
    if (projectId) {
      setIsLoading(true);
      Promise.all([
        fetchProjectDetails(projectId),
        fetchProjectMembers(projectId),
      ]).finally(() => setIsLoading(false));
    }
  }, [projectId]);

  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name || "",
        projectLead: currentProject.projectLead || "",
        defaultAssignee: currentProject.defaultAssignee || "",
        description: currentProject.description || "",
      });
    }
  }, [currentProject]);

  const handleSave = async () => {
    if (!currentProject) return;

    try {
      setIsSaving(true);
      await updateProject(currentProject.id, {
        name: formData.name,
        projectLead: formData.projectLead || null,
        defaultAssignee: formData.defaultAssignee || null,
        description: formData.description || null,
      });
      alert("Project settings updated successfully");
    } catch (error: any) {
      alert(error?.message || "Failed to update project settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentProject) return;
    if (deleteConfirmText !== currentProject.identifier) {
      alert(`Please type '${currentProject.identifier}' to confirm`);
      return;
    }

    try {
      await deleteProject(currentProject.id);
      alert("Project deleted successfully");
      // Redirect to projects page
      router.push("/");
    } catch (error: any) {
      alert(error?.message || "Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="flex h-full flex-col gap-6 p-6">
        {/* Header with Tabs */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-custom-text-300">Dự án</p>
              <h1 className="text-2xl font-semibold text-custom-text-100">{currentProject.name}</h1>
              <p className="text-sm text-custom-text-300">Cấu hình và quản lý dự án của bạn.</p>
            </div>
          </div>
          <ProjectTabs workspaceSlug={workspaceSlug} projectId={projectId} active="settings" />
        </header>

        {/* Settings Content */}
        <div className="max-w-4xl">{/* Header removed, now using ProjectTabs */}

        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            General Settings
          </h2>

          {/* Project Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Identifier (Read-only) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Identifier
            </label>
            <input
              type="text"
              value={currentProject.identifier}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Identifier cannot be changed after project creation
            </p>
          </div>

          {/* Project Lead */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Lead
            </label>
            <select
              value={formData.projectLead}
              onChange={(e) => setFormData({ ...formData, projectLead: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select Project Lead --</option>
              {projectMembers.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.userId}
                </option>
              ))}
            </select>
          </div>

          {/* Default Assignee */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Assignee
            </label>
            <select
              value={formData.defaultAssignee}
              onChange={(e) => setFormData({ ...formData, defaultAssignee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- No Default Assignee --</option>
              {projectMembers.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.userId}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              New issues will be automatically assigned to this user
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description (optional)"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="size-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-1">
                Danger Zone
              </h2>
              <p className="text-sm text-red-700 dark:text-red-300">
                Once you delete a project, there is no going back. All sprints, issues, comments,
                and activities will be permanently deleted.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            <Trash2 className="size-4" />
            Delete Project
          </button>
        </div>
        </div> {/* Close Settings Content */}
      </div> {/* Close main container */}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowDeleteDialog(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Delete Project
                </h3>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                This action cannot be undone. This will permanently delete the{" "}
                <strong>{currentProject.name}</strong> project, all sprints, issues, comments and
                activities.
              </p>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Please type <strong className="text-red-600">{currentProject.identifier}</strong> to
                confirm.
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Type '${currentProject.identifier}' to confirm`}
                className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== currentProject.identifier}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
