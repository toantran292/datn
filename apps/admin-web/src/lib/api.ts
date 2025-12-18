import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin-api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'LOCKED';
  lockReason?: string;
  lockedAt?: string;
  lockedBy?: string;
  owner: {
    id: string;
    email: string;
    displayName: string;
  };
  memberCount: number;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  email: string;
  displayName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalWorkspaces: number;
  activeWorkspaces: number;
  lockedWorkspaces: number;
  newUsersThisMonth: number;
  newWorkspacesThisMonth: number;
}

export interface ListWorkspacesParams {
  status?: 'ACTIVE' | 'LOCKED';
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListWorkspacesResponse {
  workspaces: WorkspaceInfo[];
  total: number;
  page: number;
  totalPages: number;
}

// API Functions
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await adminApi.get('/admin/dashboard/stats');
  return data;
}

export async function listWorkspaces(params: ListWorkspacesParams): Promise<ListWorkspacesResponse> {
  const { data } = await adminApi.get('/admin/workspaces', { params });
  return data;
}

export async function getWorkspace(workspaceId: string): Promise<WorkspaceInfo> {
  const { data } = await adminApi.get(`/admin/workspaces/${workspaceId}`);
  return data;
}

export async function getWorkspaceMembers(workspaceId: string): Promise<{ members: WorkspaceMember[] }> {
  const { data } = await adminApi.get(`/admin/workspaces/${workspaceId}/members`);
  return data;
}

export async function lockWorkspace(workspaceId: string, reason: string): Promise<{
  success: boolean;
  workspace: WorkspaceInfo;
  notificationsSent: number;
}> {
  const { data } = await adminApi.post(`/admin/workspaces/${workspaceId}/lock`, { reason });
  return data;
}

export async function unlockWorkspace(workspaceId: string, note?: string): Promise<{
  success: boolean;
  workspace: WorkspaceInfo;
  notificationsSent: number;
}> {
  const { data } = await adminApi.post(`/admin/workspaces/${workspaceId}/unlock`, { note });
  return data;
}

export async function revokeOwnership(
  workspaceId: string,
  data: {
    reason: string;
    newOwnerId?: string;
    removeCurrentOwner?: boolean;
  }
): Promise<{
  success: boolean;
  workspace: WorkspaceInfo;
  previousOwner: { id: string; name: string; newRole: string };
  newOwner?: { id: string; name: string };
}> {
  const { data: response } = await adminApi.post(`/admin/workspaces/${workspaceId}/revoke-ownership`, data);
  return response;
}
