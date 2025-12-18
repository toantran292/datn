"use client";

import { useParams } from "next/navigation";
import { WorkspaceFilesView } from "@/features/workspace-files";

export default function WorkspaceFilesPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  // TODO: Fetch user role from context or API
  // For now, default to MEMBER - actual role should come from workspace membership
  const userRole = "MEMBER" as const;

  return <WorkspaceFilesView workspaceId={workspaceId} userRole={userRole} />;
}
