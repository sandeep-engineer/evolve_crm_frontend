import { API_BASE_URL } from "@/lib/api/config";
import type { UserStatus } from "@/lib/api/auth";

export type PersonnelKind = "receptionists" | "callers";
export type PersonnelRole = "RECEPTIONIST" | "LEAD_CALLER";
export type StaffPersonnelRole = PersonnelRole;

export type BranchPersonnel = {
  userId: string;
  staffId: string;
  name: string;
  email: string;
  phone: string | null;
  userStatus: UserStatus;
  staffStatus: "ACTIVE" | "INACTIVE";
  organizationId: string;
  branchId: string;
  joiningDate: string;
  createdByUserId: string | null;
  createdByUser: { id: string; name: string; role: string } | null;
  branch: { id: string; name: string; organizationId: string };
  createdAt: string;
  updatedAt: string;
  staffCreatedAt: string;
  staffUpdatedAt: string;
};

export type PersonnelPayload = {
  name: string;
  email: string;
  phone: string;
  joiningDate: string;
};

export type PersonnelProvisionResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: PersonnelRole;
    organizationId: string;
    branchId: string;
    staffId: string;
    createdByUserId: string | null;
    status: UserStatus;
    mustChangePassword: false;
    temporaryPasswordExpiresAt: null;
    createdAt: string;
    updatedAt: string;
  };
  staff: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    role: StaffPersonnelRole;
    status: "ACTIVE" | "INACTIVE";
    branchId: string;
    joiningDate: string;
    createdAt: string;
    updatedAt: string;
  };
  initialPassword: string;
};

export type PersonnelListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
};

export type PaginatedPersonnel = {
  data: BranchPersonnel[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export class BranchPersonnelApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "BranchPersonnelApiError";
  }
}

function messageForStatus(status: number, data: unknown) {
  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message.every((item) => typeof item === "string")) return message[0] || "Please check the submitted details.";
  }
  if (status === 400) return "Please check the personnel details and try again.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to manage personnel for this Branch.";
  if (status === 404) return "The Branch or personnel account could not be found.";
  if (status === 409) return "This change conflicts with an existing identity or inactive Branch context.";
  return "Unable to complete the personnel request.";
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
    if (!response.ok) throw new BranchPersonnelApiError(messageForStatus(response.status, data), response.status);
    return data as T;
  } catch (error) {
    if (error instanceof BranchPersonnelApiError) throw error;
    throw new BranchPersonnelApiError("Unable to reach the server. Please try again.", 0);
  }
}

function personnelPath(branchId: string, kind: PersonnelKind) {
  return `/branches/${encodeURIComponent(branchId)}/${kind}`;
}

export function createBranchPersonnel(token: string, branchId: string, kind: PersonnelKind, payload: PersonnelPayload) {
  return request<PersonnelProvisionResponse>(personnelPath(branchId, kind), token, { method: "POST", body: JSON.stringify(payload) });
}

export function listBranchPersonnel(token: string, branchId: string, kind: PersonnelKind, query: PersonnelListQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const suffix = params.size ? `?${params.toString()}` : "";
  return request<PaginatedPersonnel>(`${personnelPath(branchId, kind)}${suffix}`, token);
}

export function getBranchPersonnel(token: string, branchId: string, kind: PersonnelKind, userId: string) {
  return request<BranchPersonnel>(`${personnelPath(branchId, kind)}/${encodeURIComponent(userId)}`, token);
}

export function updateBranchPersonnel(token: string, branchId: string, kind: PersonnelKind, userId: string, payload: Partial<PersonnelPayload>) {
  return request<BranchPersonnel>(`${personnelPath(branchId, kind)}/${encodeURIComponent(userId)}`, token, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deactivateBranchPersonnel(token: string, branchId: string, kind: PersonnelKind, userId: string) {
  return request<BranchPersonnel>(`${personnelPath(branchId, kind)}/${encodeURIComponent(userId)}/deactivate`, token, { method: "PATCH" });
}

export function reactivateBranchPersonnel(token: string, branchId: string, kind: PersonnelKind, userId: string) {
  return request<BranchPersonnel>(`${personnelPath(branchId, kind)}/${encodeURIComponent(userId)}/reactivate`, token, { method: "PATCH" });
}
