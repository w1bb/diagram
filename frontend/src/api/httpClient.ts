export interface ApiProblem {
  readonly code: string;
  readonly message: string;
  readonly correlationId?: string;
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ApiProblem | undefined;

  constructor(status: number, message: string, problem?: ApiProblem) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

export interface ApiRequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  readonly headers?: Readonly<Record<string, string>>;
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
const apiBaseUrl = configuredBaseUrl || '/api/v1';

function isApiProblem(value: unknown): value is ApiProblem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ApiProblem>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return undefined;
  }

  return response.json() as Promise<unknown>;
}

export async function apiRequest<T>(
  path: `/${string}`,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, signal, headers = {} } = options;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    ...(signal ? { signal } : {}),
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    const problem = isApiProblem(responseBody) ? responseBody : undefined;
    throw new ApiError(response.status, problem?.message ?? 'The request could not be completed.', problem);
  }

  return responseBody as T;
}
