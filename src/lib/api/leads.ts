import type { Batch } from "@/lib/api/batches";
import type { Program } from "@/lib/api/programs";
import type { Staff } from "@/lib/api/staff";

export type LeadSource =
  | "WHATSAPP_INQUIRY"
  | "WALK_IN"
  | "REFERRAL"
  | "INSTAGRAM_ADS"
  | "FACEBOOK_ADS"
  | "GOOGLE_ADS"
  | "WEBSITE"
  | "OTHER";

export type BatchTypePref =
  | "GROUP_BATCH"
  | "GROUP_PT"
  | "PERSONAL_TRAINING";

export type LeadStage =
  | "ENQUIRY"
  | "TRIAL_SCHEDULED"
  | "TRIAL_COMPLETED"
  | "CONVERTED"
  | "LOST_DECLINE";

export type LeadStatus =
  | "NEW"
  | "LEAD_FOLLOW_UP"
  | "LEAD_UNREACHABLE";

export type FollowUpOutcome =
  | "PENDING"
  | "DONE"
  | "UNREACHABLE"
  | "RESCHEDULED";

export type LeadInterest = {
  leadId: string;
  programId: string;
  program?: Program;
};

export type Lead = {
  id: string;
  branchId?: string | null;
  name: string;
  phone: string;
  dob?: string | null;
  source: LeadSource;
  batchTypePref: BatchTypePref;
  preferredBatchId?: string | null;
  preferredBatch?: Batch | null;
  stage: LeadStage;
  status: LeadStatus;
  nextFollowUpAt?: string | null;
  remark?: string | null;
  assignedStaffId?: string | null;
  assignedStaff?: Staff | null;
  interests?: LeadInterest[];
  createdAt: string;
  updatedAt: string;
};

export type LeadFollowUp = {
  id: string;
  leadId: string;
  scheduledAt: string;
  note?: string | null;
  outcome: FollowUpOutcome;
  createdAt: string;
};

export type LeadsQuery = {
  stage?: LeadStage;
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
  programId?: string;
};

export type CreateLeadPayload = {
  name: string;
  phone: string;
  dob?: string;
  source: LeadSource;
  batchTypePref?: BatchTypePref;
  preferredBatchId?: string;
  branchId?: string;
  programIds?: string[];
  goalIds?: string[];
  nextFollowUpAt?: string;
  remark?: string;
  assignedStaffId?: string;
};

export type UpdateLeadPayload = Partial<CreateLeadPayload> & {
  stage?: LeadStage;
  status?: LeadStatus;
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
          : "Lead request failed.";
    throw new Error(message);
  }

  return data as T;
}

function queryString(query: LeadsQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const value = params.toString();
  return value ? `?${value}` : "";
}

export function getLeads(token: string, query: LeadsQuery = {}) {
  return request<Lead[]>(token, `/leads${queryString(query)}`);
}

export function createLead(token: string, payload: CreateLeadPayload) {
  return request<Lead>(token, "/leads", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function getLead(token: string, id: string) {
  return request<Lead>(token, `/leads/${id}`);
}

export function updateLead(token: string, id: string, payload: UpdateLeadPayload) {
  return request<Lead>(token, `/leads/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function deleteLead(token: string, id: string) {
  return request<{ removed?: boolean }>(token, `/leads/${id}`, {
    method: "DELETE",
  });
}

export function getLeadFollowUps(token: string, id: string) {
  return request<LeadFollowUp[]>(token, `/leads/${id}/follow-ups`);
}

export function addLeadFollowUp(
  token: string,
  id: string,
  payload: { scheduledAt: string; note?: string; outcome?: FollowUpOutcome },
) {
  return request<LeadFollowUp>(token, `/leads/${id}/follow-ups`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function markLeadLost(token: string, id: string, remark?: string) {
  return request<Lead>(token, `/leads/${id}/mark-lost`, {
    body: JSON.stringify({ remark }),
    method: "POST",
  });
}

export function reEngageLead(token: string, id: string) {
  return request<Lead>(token, `/leads/${id}/re-engage`, {
    method: "POST",
  });
}

export function convertLeadToMember(
  token: string,
  id: string,
  payload: {
    address?: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
    email?: string;
  },
) {
  return request(token, `/leads/${id}/convert-to-member`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}
