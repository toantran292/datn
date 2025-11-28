"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";

const PROJECT_ID_STORAGE_KEY = "project_id";

const WorkspaceDashboardPage = observer(() => {
  const params = useParams<{ workspaceSlug: string }>();
  const router = useRouter();

  useEffect(() => {
    // Check if there's a saved project_id in localStorage
    const savedProjectId = localStorage.getItem(PROJECT_ID_STORAGE_KEY);
    
    if (savedProjectId) {
      // Auto-redirect to the last selected project's backlog
      router.push(`/project/${savedProjectId}/backlog`);
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-custom-text-100 mb-2">
          Welcome to Workspace
        </h1>
        <p className="text-custom-text-300">
          Select a project from the header to get started
        </p>
      </div>
    </div>
  );
});

export default WorkspaceDashboardPage;
