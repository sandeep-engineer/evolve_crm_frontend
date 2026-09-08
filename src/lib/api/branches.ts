import { API_BASE_URL } from "@/lib/api/config";

export type BranchStatus = "ACTIVE" | "INACTIVE";

export type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  status: BranchStatus;
  organizationId?: string;
  createdByUserId?: string;
  updatedByUserId?: string | null;
  deactivatedByUserId?: string | null;
  deactivatedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
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

type LegacyBranch = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
};

function normalizeLegacyBranch(branch: LegacyBranch): Branch {
  return {
    id: branch.id,
    name: branch.name,
    address: branch.address ?? null,
    phone: branch.phone ?? null,
    status: branch.isActive ? "ACTIVE" : "INACTIVE",
    createdAt: branch.createdAt,
  };
}

export function normalizeBranchesResponse(payload: unknown): Branch[] {
  if (Array.isArray(payload)) {
    return payload.map((branch) => normalizeLegacyBranch(branch as LegacyBranch));
  }

  if (payload && typeof payload === "object" && "data" in payload && Array.isArray(payload.data)) {
    return payload.data as Branch[];
  }

  throw new Error("Unable to load branches.");
}

export async function getBranches(token: string, query: ListBranchesQuery = {}): Promise<Branch[]> {
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const suffix = search.size ? `?${search.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/branches${suffix}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : "Unable to load branches.",
    );
  }

  return normalizeBranchesResponse(data);
}
