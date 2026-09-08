import { API_BASE_URL } from "@/lib/api/config";

export type BranchStatus = "ACTIVE" | "INACTIVE";

export type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  status: BranchStatus;
  organizationId: string;
  createdByUserId: string;
  updatedByUserId: string | null;
  deactivatedByUserId: string | null;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListBranchesQuery = {
  organizationId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: BranchStatus;
};

export type PaginatedBranches = {
  data: Branch[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateBranchPayload = {
  name: string;
  address: string;
  phone?: string;
};

export type UpdateBranchPayload = {
  name?: string;
  address?: string;
  phone?: string | null;
};

export class BranchApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BranchApiError";
  }
}

function messageForStatus(status: number, data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  if (status === 400) return "Please check the Branch details and try again.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to manage this Branch.";
  if (status === 404) return "This Branch could not be found or is no longer accessible.";
  if (status === 409) return "This Branch cannot be updated in its current state. The name may already be in use.";
  return fallback;
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new BranchApiError(
        messageForStatus(response.status, data, "Unable to complete the Branch request."),
        response.status,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof BranchApiError) throw error;
    throw new BranchApiError("Unable to reach the server. Please try again.", 0);
  }
}

function branchPath(id: string) {
  return `/branches/${encodeURIComponent(id)}`;
}

export function listBranches(token: string, query: ListBranchesQuery = {}) {
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const suffix = search.size ? `?${search.toString()}` : "";
  return request<PaginatedBranches>(`/branches${suffix}`, token);
}

export async function getBranches(token: string, query: ListBranchesQuery = {}): Promise<Branch[]> {
  return (await listBranches(token, query)).data;
}

export function getBranch(token: string, id: string) {
  return request<Branch>(branchPath(id), token);
}

export function createBranch(token: string, organizationId: string, payload: CreateBranchPayload) {
  return request<Branch>(
    `/organizations/${encodeURIComponent(organizationId)}/branches`,
    token,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function updateBranch(token: string, id: string, payload: UpdateBranchPayload) {
  return request<Branch>(branchPath(id), token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivateBranch(token: string, id: string) {
  return request<Branch>(`${branchPath(id)}/deactivate`, token, { method: "PATCH" });
}

export function reactivateBranch(token: string, id: string) {
  return request<Branch>(`${branchPath(id)}/reactivate`, token, { method: "PATCH" });
}
