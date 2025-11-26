const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

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
