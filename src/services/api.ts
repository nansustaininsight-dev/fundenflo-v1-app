/**
 * Thin fetch-based API client. Set EXPO_PUBLIC_API_URL to talk to the real backend;
 * when it is unset the services fall back to local mocks (USE_MOCK) so the journey
 * can be built and tested before the backend exists.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
export const USE_MOCK = !API_URL;

export class ApiError extends Error {
  constructor(message: string, public status = 0, public code?: string) {
    super(message);
  }
}

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}
export const authHeaders = (): Record<string, string> => (authToken ? { Authorization: `Bearer ${authToken}` } : {});

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('No internet connection. Please check your network and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.message ?? 'Something went wrong. Please try again.', res.status, data?.code);
  return data as T;
}

/** Simulated network latency for mocks. */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
