import type { AuthUser } from "@/lib/api/auth";
import { API_BASE_URL } from "@/lib/api/config";

export type StaffRole =
  | "BRANCH_ADMIN"
  | "RECEPTIONIST"
  | "LEAD_CALLER"
  | "COACH"
  | "CLEANER"
  | "OTHER";

export type StaffStatus = "ACTIVE" | "INACTIVE";

export type Staff = {
  id: string;
  branchId: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: StaffRole;
  status: StaffStatus;
  createdAt: string;
};

export type ListStaffQuery = {
  organizationId?: string;
  branchId?: string;
  page?: number;
  limit?: number;
  search?: string;
  role?: StaffRole;
  status?: StaffStatus;
};

export type PaginatedStaff = {
  data: Staff[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export class StaffApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type LegacyStaff = Omit<Staff, "role" | "status" | "branchId" | "email"> & {
  branchId?: string | null;
  email?: string | null;
  role: "TRAINER" | "RECEPTIONIST" | "ADMIN" | "MANAGER";
  status?: string;
};

function normalizeLegacyRole(role: LegacyStaff["role"]): StaffRole {
  if (role === "TRAINER") return "COACH";
  if (role === "RECEPTIONIST") return "RECEPTIONIST";

  // Legacy ADMIN and MANAGER have no equivalent Staff role in the new model.
  return "OTHER";
}

function normalizeLegacyStaff(staff: LegacyStaff): Staff {
  return {
    id: staff.id,
    branchId: staff.branchId ?? "",
    fullName: staff.fullName,
    phone: staff.phone,
    email: staff.email ?? null,
    role: normalizeLegacyRole(staff.role),
    status: staff.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    createdAt: staff.createdAt,
  };
}

function normalizeStaffResponse(data: unknown): PaginatedStaff {
  if (Array.isArray(data)) {
    const staff = data.map((item) => normalizeLegacyStaff(item as LegacyStaff));
    return {
      data: staff,
      meta: { page: 1, limit: staff.length, total: staff.length, totalPages: 1 },
    };
  }

  if (data && typeof data === "object" && "data" in data && Array.isArray(data.data)) {
    return data as PaginatedStaff;
  }

  throw new StaffApiError("Unable to load staff.", 0);
}

export function staffQueryForUser(user: AuthUser | null): ListStaffQuery | null {
  if (!user || user.role === "CRM_OWNER" || user.role === "LEAD_CALLER") return null;

  if (user.role === "ORGANIZATION_OWNER") {
    return user.organizationId ? {} : null;
  }

  return user.branchId ? { branchId: user.branchId } : null;
}

export async function getStaff(token: string, query: ListStaffQuery = {}): Promise<PaginatedStaff> {
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const suffix = search.size ? `?${search.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/staff${suffix}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : "Unable to load staff.";
    throw new StaffApiError(message, response.status);
  }

  return normalizeStaffResponse(data);
}
