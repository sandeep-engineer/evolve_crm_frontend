export type MemberStatus =
  | "PENDING_ACTIVATION"
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "FROZEN"
  | "INACTIVE"
  | "LOST_DECLINE";

export type ExpiryFilter =
  | "ANY"
  | "EXPIRING_TODAY"
  | "EXPIRING_IN_3_DAYS"
  | "EXPIRING_IN_7_DAYS"
  | "EXPIRING_IN_15_DAYS"
  | "EXPIRING_IN_30_DAYS"
  | "ALREADY_EXPIRED";

export type MemberSort =
  | "RECENTLY_ADDED"
  | "EXPIRY_NEAREST"
  | "EXPIRY_FARTHEST"
  | "NAME_A_Z"
  | "LAST_ATTENDANCE"
  | "MEMBERSHIP_VALUE";

export type MemberPreset =
  | "renewals-due-this-week"
  | "recently-expired"
  | "frozen"
  | "pending-activation"
  | "inactive";

export type MemberTag = {
  tagId: string;
  tag?: {
    id: string;
    name: string;
    color?: string | null;
  };
};

export type Member = {
  id: string;
  leadId?: string | null;
  branchId?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  dob?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactNumber?: string | null;
  status: MemberStatus;
  joinedOn: string;
  createdAt: string;
  updatedAt?: string;
  tags?: MemberTag[];
};

export type MembersQuery = {
  status?: MemberStatus;
  search?: string;
  batchId?: string;
  planId?: string;
  tagId?: string;
  expiry?: ExpiryFilter;
  sort?: MemberSort;
};

export type CreateMemberPayload = {
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  tagIds?: string[];
};

export type UpdateMemberPayload = Partial<CreateMemberPayload> & {
  status?: MemberStatus;
};

export type FollowUpOutcome =
  | "PENDING"
  | "DONE"
  | "UNREACHABLE"
  | "RESCHEDULED";

export type MemberFollowUp = {
  id: string;
  memberId: string;
  scheduledAt: string;
  note?: string | null;
  outcome: FollowUpOutcome;
  createdAt: string;
};

export type CreateMemberFollowUpPayload = {
  scheduledAt: string;
  note?: string;
  outcome?: FollowUpOutcome;
};

export type SavedView = {
  id: string;
  staffId?: string | null;
  entityType: "MEMBERS";
  name: string;
  filterJson: Record<string, unknown>;
  createdAt: string;
};

export type CreateSavedViewPayload = {
  name: string;
  filterJson: Record<string, unknown>;
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
    const message =
      typeof data?.message === "string"
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join(", ")
          : "Member request failed.";
    throw new Error(message);
  }

  return data as T;
}

function queryString(query: MembersQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const value = params.toString();
  return value ? `?${value}` : "";
}

function normalizePresetResponse(data: unknown): Member[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (item && typeof item === "object" && "member" in item) {
        return (item as { member?: Member }).member;
      }
      return item as Member;
    })
    .filter(Boolean) as Member[];
}

export function getMembers(token: string, query: MembersQuery = {}) {
  return request<Member[]>(token, `/members${queryString(query)}`);
}

export function createMember(token: string, payload: CreateMemberPayload) {
  return request<Member>(token, "/members", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function getMember(token: string, id: string) {
  return request<Member>(token, `/members/${id}`);
}

export function updateMember(
  token: string,
  id: string,
  payload: UpdateMemberPayload,
) {
  return request<Member>(token, `/members/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function deleteMember(token: string, id: string) {
  return request<{ removed?: boolean }>(token, `/members/${id}`, {
    method: "DELETE",
  });
}

export async function getMemberPreset(token: string, preset: MemberPreset) {
  const data = await request<unknown>(token, `/members/presets/${preset}`);
  return normalizePresetResponse(data);
}

export function getMemberFollowUps(token: string, id: string) {
  return request<MemberFollowUp[]>(token, `/members/${id}/follow-ups`);
}

export function addMemberFollowUp(
  token: string,
  id: string,
  payload: CreateMemberFollowUpPayload,
) {
  return request<MemberFollowUp>(token, `/members/${id}/follow-ups`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function addMemberTag(token: string, id: string, tagId: string) {
  return request<MemberTag>(token, `/members/${id}/tags/${tagId}`, {
    method: "POST",
  });
}

export function removeMemberTag(token: string, id: string, tagId: string) {
  return request<{ removed: boolean }>(token, `/members/${id}/tags/${tagId}`, {
    method: "DELETE",
  });
}

export function getSavedViews(token: string) {
  return request<SavedView[]>(token, "/members/saved-views/all?entityType=MEMBERS");
}

export function createSavedView(
  token: string,
  payload: CreateSavedViewPayload,
) {
  return request<SavedView>(token, "/members/saved-views", {
    body: JSON.stringify({ ...payload, entityType: "MEMBERS" }),
    method: "POST",
  });
}

export function deleteSavedView(token: string, viewId: string) {
  return request<{ removed?: boolean }>(token, `/members/saved-views/${viewId}`, {
    method: "DELETE",
  });
}
