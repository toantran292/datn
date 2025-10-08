const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export async function apiGet<T>(path: string, init?: any): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function apiPost<T>(path: string, body?: unknown, init?: any): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
