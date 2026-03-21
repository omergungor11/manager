const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    interface ErrorBody {
      error: { statusCode: number; code: string; message: string };
    }
    let errorBody: ErrorBody | null = null;
    try {
      errorBody = (await response.json()) as ErrorBody;
    } catch {
      // non-JSON error body
    }
    throw new ApiClientError(
      errorBody?.error.statusCode ?? response.status,
      errorBody?.error.code ?? 'UNKNOWN_ERROR',
      errorBody?.error.message ?? response.statusText,
    );
  }

  return response.json() as Promise<{ data: T; meta?: Record<string, unknown> }>;
}

function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `?${qs}`;
}

export const adminApiClient = {
  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
  ): Promise<{ data: T; meta?: Record<string, unknown> }> {
    const qs = params ? buildQueryString(params) : '';
    return request<T>(`${path}${qs}`);
  },

  post<T>(path: string, body: unknown): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  patch<T>(
    path: string,
    body: unknown,
  ): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete<T>(path: string): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return request<T>(path, { method: 'DELETE' });
  },
};

// ---- Typed helpers ----

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  plan: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TenantStats {
  tenantId: string;
  tenantName: string;
  users: number;
  workOrders: number;
  invoices: number;
}

export interface GlobalStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminApi = {
  // ---- Global stats ----
  getGlobalStats(): Promise<{ data: GlobalStats }> {
    return adminApiClient.get<GlobalStats>('/api/v1/admin/stats');
  },

  // ---- Tenant CRUD ----
  getTenants(params?: {
    search?: string;
    status?: string;
    plan?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Tenant[]; meta?: Record<string, unknown> }> {
    return adminApiClient.get<Tenant[]>('/api/v1/admin/tenants', params);
  },

  getTenant(id: string): Promise<{ data: Tenant }> {
    return adminApiClient.get<Tenant>(`/api/v1/admin/tenants/${id}`);
  },

  createTenant(body: {
    name: string;
    slug: string;
    plan?: string;
    status?: string;
  }): Promise<{ data: Tenant }> {
    return adminApiClient.post<Tenant>('/api/v1/admin/tenants', body);
  },

  updateTenant(
    id: string,
    body: Partial<{ name: string; slug: string; plan: string; status: string }>,
  ): Promise<{ data: Tenant }> {
    return adminApiClient.patch<Tenant>(`/api/v1/admin/tenants/${id}`, body);
  },

  deleteTenant(id: string): Promise<{ data: Tenant }> {
    return adminApiClient.delete<Tenant>(`/api/v1/admin/tenants/${id}`);
  },

  getTenantStats(id: string): Promise<{ data: TenantStats }> {
    return adminApiClient.get<TenantStats>(`/api/v1/admin/tenants/${id}/stats`);
  },
};
