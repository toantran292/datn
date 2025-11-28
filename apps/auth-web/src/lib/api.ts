const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshComplete(newToken: string | null) {
  refreshSubscribers.forEach(callback => callback(newToken));
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

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('[API] Token refresh failed:', error);
    return false;
  }
}

async function fetchWithTokenRefresh<T>(
  url: string,
  options: RequestInit
): Promise<Response> {
  // First attempt
  let response = await fetch(url, options);

  // If 401, try to refresh token and retry
  if (response.status === 401 && !url.includes('/auth/refresh')) {
    // Avoid infinite loop for refresh endpoint itself
    if (isRefreshing) {
      // Wait for the refresh to complete
      return new Promise((resolve) => {
        subscribeTokenRefresh(async (newToken) => {
          if (newToken === null) {
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
      onRefreshComplete('refreshed'); // Signal successful refresh
      // Retry the original request
      response = await fetch(url, options);
    } else {
      onRefreshComplete(null); // Signal failed refresh
      // Could redirect to login here if needed
      // window.location.href = '/login';
    }
  }

  return response;
}

export async function apiGet<T>(path: string, init?: any): Promise<T> {
  const fullUrl = `${API_BASE}${path}`;
  console.log('[API] GET request to:', fullUrl);

  const response = await fetchWithTokenRefresh(fullUrl, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  console.log('[API] Response status:', response.status);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function apiPost<T>(path: string, body?: unknown, init?: any): Promise<T> {
  const fullUrl = `${API_BASE}${path}`;
  console.log('[API] POST request to:', fullUrl);

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

  console.log('[API] Response status:', response.status);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
