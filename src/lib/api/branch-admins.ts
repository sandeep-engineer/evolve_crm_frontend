import { API_BASE_URL } from "@/lib/api/config";

export type BranchAdminStatus = "PENDING_SETUP" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

export type BranchAdmin = {
  userId: string;
  staffId: string;
  name: string;
  email: string;
  phone: string | null;
  userStatus: BranchAdminStatus;
  staffStatus: "ACTIVE" | "INACTIVE";
  organizationId: string;
  branchId: string;
  joiningDate: string;
  createdByUserId: string | null;
  createdByUser: { id: string; name: string; role: string } | null;
  branch: { id: string; name: string; organizationId: string };
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
  staffCreatedAt: string;
  staffUpdatedAt: string;
};

export type CreateBranchAdminPayload = {
  name: string;
  email: string;
  phone: string;
  joiningDate: string;
};

export type CreateBranchAdminResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: "BRANCH_ADMIN";
    organizationId: string;
    branchId: string;
    staffId: string;
    status: BranchAdminStatus;
    mustChangePassword: false;
    temporaryPasswordExpiresAt: null;
  };
  staff: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    role: "BRANCH_ADMIN";
    status: "ACTIVE" | "INACTIVE";
    branchId: string;
    joiningDate: string;
  };
  initialPassword: string;
};

export type ListBranchAdminsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: BranchAdminStatus;
};

export type PaginatedBranchAdmins = {
  data: BranchAdmin[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type UpdateBranchAdminPayload = Partial<CreateBranchAdminPayload>;

export class BranchAdminApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function messageForStatus(status: number, data: unknown) {
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
    return data.message;
  }
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to manage Branch Admins.";
  if (status === 404) return "The Branch or Branch Admin could not be found.";
  if (status === 409) return "This change conflicts with an existing identity or inactive Branch context.";
  return "Unable to complete the Branch Admin request.";
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
    if (!response.ok) throw new BranchAdminApiError(messageForStatus(response.status, data), response.status);
    return data as T;
  } catch (error) {
    if (error instanceof BranchAdminApiError) throw error;
    throw new BranchAdminApiError("Unable to reach the server. Please try again.", 0);
  }
}

function adminsPath(branchId: string) {
  return `/branches/${encodeURIComponent(branchId)}/admins`;
}

export function createBranchAdmin(token: string, branchId: string, payload: CreateBranchAdminPayload) {
  return request<CreateBranchAdminResponse>(adminsPath(branchId), token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listBranchAdmins(token: string, branchId: string, query: ListBranchAdminsQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const suffix = params.size ? `?${params.toString()}` : "";
  return request<PaginatedBranchAdmins>(`${adminsPath(branchId)}${suffix}`, token);
}

export function getBranchAdmin(token: string, branchId: string, userId: string) {
  return request<BranchAdmin>(`${adminsPath(branchId)}/${encodeURIComponent(userId)}`, token);
}

export function updateBranchAdmin(token: string, branchId: string, userId: string, payload: UpdateBranchAdminPayload) {
  return request<BranchAdmin>(`${adminsPath(branchId)}/${encodeURIComponent(userId)}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivateBranchAdmin(token: string, branchId: string, userId: string) {
  return request<BranchAdmin>(`${adminsPath(branchId)}/${encodeURIComponent(userId)}/deactivate`, token, { method: "PATCH" });
}

export function reactivateBranchAdmin(token: string, branchId: string, userId: string) {
  return request<BranchAdmin>(`${adminsPath(branchId)}/${encodeURIComponent(userId)}/reactivate`, token, { method: "PATCH" });
}
