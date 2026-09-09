import { API_BASE_URL } from "@/lib/api/config";

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
  | "NEW"
  | "CONTACTED"
  | "VISIT_SCHEDULED"
  | "VISITED"
  | "TRIAL_REQUESTED"
  | "TRIAL_SCHEDULED"
  | "TRIAL_COMPLETED"
  | "READY_TO_JOIN"
  | "CONVERTED"
  | "LOST";

export type LeadStatus =
  | "ACTIVE"
  | "FOLLOW_UP"
  | "UNREACHABLE"
  | "DORMANT"
  | "ARCHIVED";

export type LeadCurrentIntent =
  | "UNDECIDED"
  | "NEEDS_TIME"
  | "TRIAL"
  | "DIRECT_JOINING";

export type LeadCommunicationChannel =
  | "PHONE_CALL"
  | "WHATSAPP"
  | "SMS"
  | "EMAIL"
  | "IN_PERSON";

export type SafeBranchSummary = {
  id: string;
  name: string;
  organizationId: string;
};

export type SafeAssignedUserSummary = {
  id: string;
  name: string;
  role: "BRANCH_ADMIN" | "RECEPTIONIST" | string;
  organizationId: string | null;
  branchId: string | null;
};

export type LeadSummary = {
  id: string;
  branchId: string;
  branch: SafeBranchSummary | null;
  organizationId: string | null;
  fullName: string;
  primaryPhone: string | null;
  alternatePhone: string | null;
  email: string | null;
  source: LeadSource;
  preferredChannel: LeadCommunicationChannel | null;
  currentIntent: LeadCurrentIntent;
  batchTypePref: BatchTypePref | null;
  preferredBatchId: string | null;
  stage: LeadStage;
  status: LeadStatus;
  assignedUser: SafeAssignedUserSummary | null;
  currentSummary: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedLeads = {
  data: LeadSummary[];
  meta: PaginationMeta;
};

export type LeadListQuery = {
  organizationId?: string;
  branchId: string;
  page?: number;
  limit?: number;
  search?: string;
  stage?: LeadStage;
  status?: LeadStatus;
  source?: LeadSource;
  programId?: string;
  assignedUserId?: string;
  createdFrom?: string;
  createdTo?: string;
  followUpFrom?: string;
  followUpTo?: string;
};

export type CreateLeadRequest = {
  fullName: string;
  primaryPhone: string;
  alternatePhone?: string | null;
  email?: string | null;
  dob?: string | null;
  source: LeadSource;
  sourceDetails?: string | null;
  preferredChannel?: LeadCommunicationChannel | null;
  currentIntent?: LeadCurrentIntent;
  batchTypePref?: BatchTypePref | null;
  preferredBatchId?: string | null;
  preferredDays?: number[] | null;
  preferredStartTime?: string | null;
  preferredEndTime?: string | null;
  programIds?: string[];
  goalIds?: string[];
  assignedUserId?: string | null;
  currentSummary?: string | null;
};

export type LeadPhoneConflict = {
  code: "LEAD_PHONE_CONFLICT";
  message: string;
  existingLead: Pick<
    LeadSummary,
    "id" | "fullName" | "primaryPhone" | "stage" | "status" | "lastContactedAt"
  > | null;
};

export type BackendErrorResponse = {
  code?: string;
  message?: string | string[];
  error?: string;
  statusCode?: number;
  existingLead?: LeadPhoneConflict["existingLead"];
};

export class LeadApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: BackendErrorResponse,
  ) {
    super(message);
    this.name = "LeadApiError";
  }
}

export class LeadPhoneConflictError extends LeadApiError {
  readonly existingLead: LeadPhoneConflict["existingLead"];

  constructor(details: LeadPhoneConflict, status: number) {
    super(details.message, status, details);
    this.name = "LeadPhoneConflictError";
    this.existingLead = details.existingLead;
  }
}

function messageForStatus(status: number, data: BackendErrorResponse | null) {
  if (data?.code === "LEAD_PHONE_CONFLICT" && typeof data.message === "string") {
    return data.message;
  }
  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data?.message)) return data.message.join(", ");
  if (status === 400) return "Please check the Lead details and try again.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to use Lead Management.";
  if (status === 404) return "The requested Lead or Branch could not be found.";
  if (status === 409) return "This Lead conflicts with existing Branch data.";
  return "Unable to complete the Lead request.";
}

async function request<T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => null) as BackendErrorResponse | null;

    if (!response.ok) {
      if (
        response.status === 409 &&
        data?.code === "LEAD_PHONE_CONFLICT" &&
        typeof data.message === "string"
      ) {
        throw new LeadPhoneConflictError(
          {
            code: "LEAD_PHONE_CONFLICT",
            message: data.message,
            existingLead: data.existingLead ?? null,
          },
          response.status,
        );
      }
      throw new LeadApiError(messageForStatus(response.status, data), response.status, data ?? undefined);
    }

    return data as T;
  } catch (error) {
    if (error instanceof LeadApiError) throw error;
    throw new LeadApiError("Unable to reach the server. Please try again.", 0);
  }
}

function queryString(query: LeadListQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function listLeads(token: string, query: LeadListQuery) {
  const suffix = queryString(query);
  return request<PaginatedLeads>(token, `/leads?${suffix}`);
}

export function createLeadForBranch(
  token: string,
  branchId: string,
  payload: CreateLeadRequest,
) {
  return request<LeadSummary>(token, `/branches/${encodeURIComponent(branchId)}/leads`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}
