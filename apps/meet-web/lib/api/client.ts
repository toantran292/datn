/**
 * API Client with error handling
 */

const API_URL = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

/**
 * Base fetch wrapper with error handling
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_URL}${endpoint}`;

  // Add query params if provided
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      `API request failed: ${errorText}`,
      response.status,
      errorText
    );
  }

  return response.json();
}

/**
 * GET request
 */
export function get<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  return request<T>(endpoint, { method: 'GET', params });
}

/**
 * POST request
 */
export function post<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export function put<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export function del<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return request<T>(endpoint, {
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export { API_URL };
