const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

function subscribeTokenRefresh(callback: (success: boolean) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshComplete(success: boolean) {
  refreshSubscribers.forEach(callback => callback(success));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[API] Token refresh failed:', error);
    return false;
  }
}

async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit
): Promise<Response> {
  // First attempt
  let response = await fetch(url, options);

  // If 401, try to refresh token and retry
  if (response.status === 401 && !url.includes('/auth/refresh')) {
    if (isRefreshing) {
      // Wait for the refresh to complete
      return new Promise((resolve) => {
        subscribeTokenRefresh(async (success) => {
          if (!success) {
            resolve(response); // Return the original 401 response
          } else {
            // Retry the request with the new token
            const retryResponse = await fetch(url, options);
            resolve(retryResponse);
          }
        });
      });
    }

    isRefreshing = true;
    const refreshed = await refreshAccessToken();
    isRefreshing = false;

    if (refreshed) {
      onRefreshComplete(true); // Signal successful refresh
      // Retry the original request
      response = await fetch(url, options);
    } else {
      onRefreshComplete(false); // Signal failed refresh
      // Redirect to login
      window.location.href = 'http://localhost:3000/login';
    }
  }

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorData;

    if (contentType?.includes('application/json')) {
      errorData = await response.json();
    } else {
      errorData = await response.text();
    }

    throw new ApiError(
      `API Error: ${response.status} ${response.statusText}`,
      response.status,
      errorData
    );
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text() as any;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const response = await fetchWithTokenRefresh(fullUrl, {
    method: 'GET',
    credentials: 'include', // Important: send cookies
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  return handleResponse<T>(response);
}

export async function apiPost<T>(
  path: string,
  body?: any,
  init?: RequestInit
): Promise<T> {
  const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const response = await fetchWithTokenRefresh(fullUrl, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  return handleResponse<T>(response);
}

export async function apiPut<T>(
  path: string,
  body?: any,
  init?: RequestInit
): Promise<T> {
  const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const response = await fetchWithTokenRefresh(fullUrl, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const response = await fetchWithTokenRefresh(fullUrl, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  return handleResponse<T>(response);
}

export async function apiPatch<T>(
  path: string,
  body?: any,
  init?: RequestInit
): Promise<T> {
  const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const response = await fetchWithTokenRefresh(fullUrl, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  return handleResponse<T>(response);
}

// Dashboard types (matching tenant-bff response)
export interface RecentActivity {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  description: string;
  createdAt: string;
}

export interface MemberStats {
  total: number;
  owners: number;
  admins: number;
  staff: number;
  guests: number;
}

export interface ActivityStats {
  totalActions: number;
  todayActions: number;
  thisWeekActions: number;
  recentActivities: RecentActivity[];
}

export interface ProjectLite {
  id: string;
  identifier: string;
  name: string;
  projectLead: string | null;
}

export interface StorageStats {
  usedBytes: number;
  limitBytes: number;
  usedPercent: number;
}

export interface DashboardResponse {
  orgId: string;
  orgName: string;
  status: string;
  members: MemberStats;
  activities: ActivityStats;
  projects: {
    total: number;
    items: ProjectLite[];
  };
  storage: StorageStats;
}

// Legacy types for backward compatibility
export interface Activity {
  id: string;
  type: 'FILE_UPLOADED' | 'REPORT_CREATED' | 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'SETTINGS_UPDATED';
  user: { id: string; name: string; avatar?: string };
  description: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ActivitiesResponse {
  activities: Activity[];
  hasMore: boolean;
}

export interface StatsResponse {
  memberCount: number;
  fileCount: number;
  reportCount: number;
  storage: {
    usedGb: number;
    limitGb: number;
  };
  trend: {
    files: { thisWeek: number; lastWeek: number; change: number };
    reports: { thisWeek: number; lastWeek: number; change: number };
  };
}

// Dashboard API function
export async function getDashboard(): Promise<DashboardResponse> {
  return apiGet<DashboardResponse>('/tenant/dashboard');
}

// Legacy functions - transform dashboard data to old format
export async function getStats(): Promise<StatsResponse> {
  const dashboard = await getDashboard();
  return {
    memberCount: dashboard.members.total,
    fileCount: 0,
    reportCount: 0,
    storage: { usedGb: 0, limitGb: 100 },
    trend: {
      files: { thisWeek: 0, lastWeek: 0, change: 0 },
      reports: { thisWeek: 0, lastWeek: 0, change: 0 },
    },
  };
}

export async function getActivities(limit: number = 10): Promise<ActivitiesResponse> {
  const dashboard = await getDashboard();
  const activities: Activity[] = dashboard.activities.recentActivities.slice(0, limit).map(a => ({
    id: a.id,
    type: mapActionToType(a.action),
    user: { id: a.userId || '', name: a.userEmail || 'Unknown' },
    description: a.description,
    metadata: {},
    createdAt: a.createdAt,
  }));
  return {
    activities,
    hasMore: dashboard.activities.recentActivities.length > limit,
  };
}

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

// Member types
export interface Member {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  role: string;
  status: 'active' | 'pending';
  joined_at: string;
  roles?: string[];
  member_type?: string;
  project_roles?: ProjectRole[];
}

export interface ProjectRole {
  project_id: string;
  project_name: string;
  role: string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface InviteMemberRequest {
  email: string;
  role: string;
  project_ids?: string[];
}

export interface UpdateMemberRequest {
  role?: string;
  project_roles?: ProjectRole[];
}

// Member API functions
export async function getOrgMembers(page: number = 0, size: number = 20): Promise<PagedResponse<Member>> {
  return apiGet<PagedResponse<Member>>(`/tenant/members?page=${page}&size=${size}`);
}

export async function inviteMember(data: InviteMemberRequest): Promise<Member> {
  return apiPost<Member>(`/tenant/members/invite`, data);
}

export async function updateMember(memberId: string, data: UpdateMemberRequest): Promise<Member> {
  return apiPut<Member>(`/tenant/members/${memberId}`, data);
}

export async function removeMember(memberId: string): Promise<void> {
  return apiDelete<void>(`/tenant/members/${memberId}`);
}

export async function updateMemberRole(memberId: string, roles: string[]): Promise<void> {
  return apiPatch<void>(`/tenant/members/${memberId}/role`, { roles });
}

// Invitation types
export interface Invitation {
  id: string;
  email: string;
  memberType: string;
  createdAt: string;
}

export interface InvitationsResponse {
  invitations: Invitation[];
}

// Invitation API functions
export async function getInvitations(): Promise<InvitationsResponse> {
  return apiGet<InvitationsResponse>('/tenant/members/invitations');
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  return apiDelete<void>(`/tenant/members/invitations/${invitationId}`);
}

// Project types for member assignment
export interface Project {
  id: string;
  identifier: string;
  name: string;
  description?: string;
}

export interface ProjectsResponse {
  items: Project[];
  total: number;
}

// Projects API
export async function getProjects(): Promise<ProjectsResponse> {
  return apiGet<ProjectsResponse>('/tenant/projects');
}

// ============================================================================
// REPORTS API
// ============================================================================

export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ReportType = 'SUMMARY' | 'ANALYSIS' | 'EXTRACTION' | 'COMPARISON' | 'CUSTOM';
export type LlmProvider = 'OPENAI' | 'ANTHROPIC' | 'GOOGLE';
export type ExportFormat = 'PDF' | 'DOCX' | 'MARKDOWN' | 'HTML';

export interface Report {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  type: ReportType;
  status: ReportStatus;
  llmProvider: LlmProvider;
  llmModel: string;
  prompt?: string;
  content?: string;
  fileIds: string[];
  config?: Record<string, any>;
  errorMessage?: string;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ReportSummary {
  id: string;
  name: string;
  type: ReportType;
  status: ReportStatus;
  llmProvider: LlmProvider;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateReportRequest {
  name: string;
  description?: string;
  type: ReportType;
  llmProvider: LlmProvider;
  llmModel: string;
  fileIds: string[];
  prompt?: string;
  config?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface ReportStatusResponse {
  id: string;
  status: ReportStatus;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ReportTypeInfo {
  type: ReportType;
  name: string;
  description: string;
  defaultPrompt: string;
}

export interface ExportFormatInfo {
  format: ExportFormat;
  name: string;
  mimeType: string;
  extension: string;
}

export interface PagedReportsResponse {
  items: ReportSummary[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

// Reports API functions
export async function getReports(page: number = 0, size: number = 20): Promise<PagedReportsResponse> {
  return apiGet<PagedReportsResponse>(`/tenant/reports?page=${page}&size=${size}`);
}

export async function getReport(reportId: string): Promise<Report> {
  return apiGet<Report>(`/tenant/reports/${reportId}`);
}

export async function createReport(data: CreateReportRequest): Promise<Report> {
  return apiPost<Report>('/tenant/reports', data);
}

export async function getReportStatus(reportId: string): Promise<ReportStatusResponse> {
  return apiGet<ReportStatusResponse>(`/tenant/reports/${reportId}/status`);
}

export async function deleteReport(reportId: string): Promise<void> {
  return apiDelete<void>(`/tenant/reports/${reportId}`);
}

export async function retryReport(reportId: string): Promise<Report> {
  return apiPost<Report>(`/tenant/reports/${reportId}/retry`);
}

export async function getReportTypes(): Promise<ReportTypeInfo[]> {
  return apiGet<ReportTypeInfo[]>('/tenant/reports/types');
}

export async function getExportFormats(): Promise<ExportFormatInfo[]> {
  return apiGet<ExportFormatInfo[]>('/tenant/reports/export/formats');
}

export async function exportReport(reportId: string, format: ExportFormat): Promise<Blob> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const response = await fetch(`${API_BASE}/tenant/reports/${reportId}/export?format=${format}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError(`Export failed: ${response.statusText}`, response.status);
  }

  return response.blob();
}

// ============================================================================
// AGENT API (UTS Agent)
// ============================================================================

export interface AgentChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentChatRequest {
  message: string;
  history?: AgentChatMessage[];
  projectId?: string;
}

export interface AgentChatResponse {
  response: string;
  context?: {
    projects?: number;
    tasks?: number;
    members?: number;
  };
}

export async function agentChat(request: AgentChatRequest): Promise<AgentChatResponse> {
  return apiPost<AgentChatResponse>('/tenant/agent/chat', request);
}

/**
 * Streaming agent chat - returns async generator for SSE
 */
export async function* agentChatStream(
  request: AgentChatRequest,
  onStart?: () => void
): AsyncGenerator<string, void, unknown> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

  const response = await fetch(`${API_BASE}/tenant/agent/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new ApiError(`Stream failed: ${response.statusText}`, response.status);
  }

  onStart?.();

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            yield parsed.text;
          }
        } catch (e) {
          // Skip invalid JSON lines
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }
}
