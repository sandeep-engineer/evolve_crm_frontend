import type { Batch } from "@/lib/api/batches";
import type { Member } from "@/lib/api/members";
import type { Plan } from "@/lib/api/plans";

export type MembershipStatus =
  | "PENDING_ACTIVATION"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED";

export type Membership = {
  id: string;
  memberId: string;
  member?: Member;
  planId: string;
  plan?: Plan;
  batchId?: string | null;
  batch?: Batch | null;
  invoiceDate: string;
  startDate: string;
  endDate: string;
  planActualPrice: string | number;
  purchasePrice: string | number;
  status: MembershipStatus;
  createdAt: string;
};

export type CreateMembershipPayload = {
  memberId: string;
  planId: string;
  batchId?: string;
  invoiceDate: string;
  startDate: string;
  endDate: string;
  planActualPrice: number;
  purchasePrice: number;
};

export type UpdateMembershipPayload = Partial<CreateMembershipPayload> & {
  status?: MembershipStatus;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

async function request<T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string" ? data.message : "Membership request failed.",
    );
  }

  return data as T;
}

export function getMemberships(token: string, memberId?: string) {
  const query = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  return request<Membership[]>(token, `/memberships${query}`);
}

export function createMembership(
  token: string,
  payload: CreateMembershipPayload,
) {
  return request<Membership>(token, "/memberships", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateMembership(
  token: string,
  id: string,
  payload: UpdateMembershipPayload,
) {
  return request<Membership>(token, `/memberships/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function cancelMembership(token: string, id: string) {
  return request<Membership>(token, `/memberships/${id}/cancel`, {
    method: "POST",
  });
}
