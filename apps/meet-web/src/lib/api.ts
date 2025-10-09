const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:40600';

export async function apiGet<T>(path: string, init?: any): Promise<T> {
  const fullUrl = `${API_BASE}${path}`;
  console.log('[API] GET request to:', fullUrl);

  const response = await fetch(fullUrl, {
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

  const response = await fetch(fullUrl, {
    method: 'POST',
    // credentials: 'include',
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
