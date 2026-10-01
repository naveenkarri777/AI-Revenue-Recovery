import type {
  DashboardData,
  RecoveryCase,
  PaginatedCasesResult,
  AuditEntry,
  ActivityItem,
  RecoveryPolicies,
  BatchResult,
} from "../data/types";

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : "/api/v1";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = json?.message || `Request failed with status ${res.status}`;
    const code = json?.error?.code || "API_ERROR";
    const details = json?.error?.details;
    throw new ApiError(message, res.status, code, details);
  }

  return json.data as T;
}

export const api = {
  // Dashboard
  async getDashboard(): Promise<DashboardData> {
    return request<DashboardData>("/recovery/dashboard");
  },

  // Recovery Cases
  async getRecoveryCases(params?: {
    query?: string;
    status?: string;
    risk?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedCasesResult> {
    const q = new URLSearchParams();
    if (params?.query) q.set("query", params.query);
    if (params?.status && params.status !== "All Statuses") q.set("status", params.status);
    if (params?.risk && params.risk !== "All Risk") q.set("risk", params.risk);
    if (params?.page) q.set("page", String(params.page));
    if (params?.pageSize) q.set("pageSize", String(params.pageSize));

    const qs = q.toString() ? `?${q.toString()}` : "";
    const url = `${API_BASE}/recovery-cases${qs}`;
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    const json = await res.json();
    if (!res.ok) {
      throw new ApiError(json?.message || "Failed to load recovery cases", res.status);
    }

    return {
      items: json.data?.items || [],
      total: json.data?.total || 0,
      page: json.data?.page || 1,
      pageSize: json.data?.pageSize || 10,
      totalPages: json.data?.totalPages || 1,
      stats: json.meta?.stats,
    };
  },

  async getCaseById(id: string): Promise<RecoveryCase> {
    return request<RecoveryCase>(`/recovery-cases/${encodeURIComponent(id)}`);
  },

  async processCase(id: string): Promise<RecoveryCase> {
    return request<RecoveryCase>(`/recovery-cases/${encodeURIComponent(id)}/process`, {
      method: "POST",
    });
  },

  async getCaseLogs(id: string): Promise<AuditEntry[]> {
    return request<AuditEntry[]>(`/recovery-cases/${encodeURIComponent(id)}/logs`);
  },

  // Demo Batch
  async runDemoBatch(batchSize = 20): Promise<BatchResult> {
    return request<BatchResult>("/demo/run-batch", {
      method: "POST",
      body: JSON.stringify({ batchSize }),
    });
  },

  // Activity Feed
  async getActivityFeed(limit = 30): Promise<ActivityItem[]> {
    return request<ActivityItem[]>(`/activity?limit=${limit}`);
  },

  // Settings & Policies
  async getPolicies(): Promise<RecoveryPolicies> {
    return request<RecoveryPolicies>("/settings/policies");
  },

  async updatePolicies(policies: Partial<RecoveryPolicies>): Promise<RecoveryPolicies> {
    return request<RecoveryPolicies>("/settings/policies", {
      method: "PUT",
      body: JSON.stringify(policies),
    });
  },

  // Ingest Revenue Event
  async ingestRevenueEvent(data: {
    paymentId: string;
    customerName: string;
    amount: number;
    paymentMethod: string;
    failureReason: string;
    customerId?: string;
  }): Promise<{ event: unknown; recoveryCase: RecoveryCase }> {
    return request<{ event: unknown; recoveryCase: RecoveryCase }>("/revenue-events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

