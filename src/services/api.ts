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

type ErrorBody = { message?: string; code?: string; success?: boolean; data?: unknown };

function readError(data: unknown): { message?: string; code?: string } {
  if (!data || typeof data !== 'object') return {};
  const row = data as Record<string, unknown>;
  return {
    message: typeof row.message === 'string' ? row.message : undefined,
    code: typeof row.code === 'string' ? row.code : undefined,
  };
}

function unwrap(data: unknown): unknown {
  if (!data || typeof data !== 'object' || !('success' in data)) return data;
  const body = data as ErrorBody;
  if (body.success === false) {
    throw new ApiError(body.message ?? 'Something Went Wrong. Please Try Again.', 200, body.code);
  }
  return 'data' in body ? body.data : data;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
      headers: {
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
        ...init.headers,
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('No Internet Connection. Please Check Your Network And Try Again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = readError(data);
    throw new ApiError(err.message ?? 'Something Went Wrong. Please Try Again.', res.status, err.code);
  }
  return unwrap(data) as T;
}

/** Simulated network latency for mocks. */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
