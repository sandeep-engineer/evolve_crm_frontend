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

export type LeadTimelineEventType =
  | "LEAD_CREATED"
  | "LEAD_PROFILE_UPDATED"
  | "LEAD_ASSIGNMENT_CHANGED"
  | "LEAD_VISIT_RECORDED"
  | "FOLLOW_UP_SCHEDULED"
  | "FOLLOW_UP_COMPLETED"
  | "FOLLOW_UP_RESCHEDULED"
  | "FOLLOW_UP_CANCELLED"
  | "LEAD_CONTACT_RECORDED"
  | "LEAD_NOTE_ADDED"
  | "LEAD_MARKED_LOST"
  | "LEAD_REENGAGED"
  | "LEAD_ARCHIVED"
  | "LEAD_REACTIVATED";

export type SafeBranchSummary = {
  id: string;
  name: string;
  organizationId: string;
};

export type SafeAssignedUserSummary = {
  id: string;
  name: string;
  role: "CRM_OWNER" | "ORGANIZATION_OWNER" | "BRANCH_ADMIN" | "RECEPTIONIST" | string;
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

export type LeadAssociationSummary = {
  id: string;
  name: string;
};

export type LeadProgramInterest = {
  programId: string;
  program: LeadAssociationSummary | null;
};

export type LeadGoalInterest = {
  goalId: string;
  goal: LeadAssociationSummary | null;
};

export type LeadDetail = LeadSummary & {
  dob: string | null;
  sourceDetails: string | null;
  preferredDays: number[] | null;
  preferredStartTime: string | null;
  preferredEndTime: string | null;
  lostReason: string | null;
  lostExplanation: string | null;
  archivedAt: string | null;
  lastVisitedAt: string | null;
  lostAt: string | null;
  reengagedAt: string | null;
  convertedAt: string | null;
  createdByUser: SafeAssignedUserSummary | null;
  updatedByUser: SafeAssignedUserSummary | null;
  archivedByUser: SafeAssignedUserSummary | null;
  interests: LeadProgramInterest[];
  goals: LeadGoalInterest[];
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

export type UpdateLeadRequest = Partial<Omit<CreateLeadRequest, "assignedUserId">>;

export type UpdateLeadAssignmentRequest = {
  assignedUserId: string | null;
};

export type LeadAssigneeOption = {
  userId: string;
  name: string;
  role: "BRANCH_ADMIN" | "RECEPTIONIST";
  organizationId: string;
  branchId: string;
};

export type LeadAssigneeQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: LeadAssigneeOption["role"];
};

export type PaginatedLeadAssignees = {
  data: LeadAssigneeOption[];
  meta: PaginationMeta;
};

export type LeadProgramSnapshot = {
  id: string;
  name: string | null;
};

export type LeadVisitProgramSnapshot = {
  programId: string;
  programNameSnapshot: string | null;
};

export type LeadVisitSummary = {
  id: string;
  leadId: string;
  branchId: string;
  visitedAt: string;
  createdAt: string;
  discussion: string;
  programs: LeadVisitProgramSnapshot[];
  currentIntent: LeadCurrentIntent | null;
  preferredDays: number[] | null;
  preferredStartTime: string | null;
  preferredEndTime: string | null;
  nextActionNote: string | null;
  actorUser: Pick<SafeAssignedUserSummary, "id" | "name"> | null;
};

export type LeadVisitDetail = LeadVisitSummary;

export type PaginatedLeadVisits = {
  data: LeadVisitSummary[];
  meta: PaginationMeta;
};

export type RecordLeadVisitRequest = {
  discussion: string;
  programIds?: string[];
  currentIntent?: LeadCurrentIntent | null;
  preferredDays?: number[] | null;
  preferredStartTime?: string | null;
  preferredEndTime?: string | null;
  nextActionNote?: string | null;
};

export type LeadTimelineActor = SafeAssignedUserSummary;

export type LeadTimelineMetadata = Record<string, unknown>;

export type LeadTimelineEvent = {
  id: string;
  leadId: string;
  branchId: string;
  eventType: LeadTimelineEventType;
  actorUserId: string;
  actorUser: LeadTimelineActor | null;
  occurredAt: string;
  summary: string;
  metadata: LeadTimelineMetadata;
  metadataVersion: number;
  createdAt: string;
};

export type LeadTimelineQuery = {
  page?: number;
  limit?: number;
  eventType?: LeadTimelineEventType;
};

export type PaginatedLeadTimeline = {
  data: LeadTimelineEvent[];
  meta: PaginationMeta;
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

function queryString(query: Record<string, string | number | null | undefined>) {
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

export function getLeadDetail(token: string, id: string) {
  return request<LeadDetail>(token, `/leads/${encodeURIComponent(id)}`);
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

export function updateLeadProfile(
  token: string,
  id: string,
  payload: UpdateLeadRequest,
) {
  return request<LeadDetail>(token, `/leads/${encodeURIComponent(id)}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updateLeadAssignment(
  token: string,
  id: string,
  payload: UpdateLeadAssignmentRequest,
) {
  return request<LeadDetail>(token, `/leads/${encodeURIComponent(id)}/assignment`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function listLeadAssignees(
  token: string,
  branchId: string,
  query: LeadAssigneeQuery = {},
) {
  const suffix = queryString(query);
  return request<PaginatedLeadAssignees>(
    token,
    `/branches/${encodeURIComponent(branchId)}/lead-assignees${suffix ? `?${suffix}` : ""}`,
  );
}

export function getLeadTimeline(
  token: string,
  leadId: string,
  query: LeadTimelineQuery = {},
) {
  const suffix = queryString(query);
  return request<PaginatedLeadTimeline>(
    token,
    `/leads/${encodeURIComponent(leadId)}/timeline${suffix ? `?${suffix}` : ""}`,
  );
}

export function listLeadVisits(
  token: string,
  leadId: string,
  query: { page?: number; limit?: number } = {},
) {
  const suffix = queryString(query);
  return request<PaginatedLeadVisits>(
    token,
    `/leads/${encodeURIComponent(leadId)}/visits${suffix ? `?${suffix}` : ""}`,
  );
}

export function getLeadVisitDetail(
  token: string,
  leadId: string,
  visitId: string,
) {
  return request<LeadVisitDetail>(
    token,
    `/leads/${encodeURIComponent(leadId)}/visits/${encodeURIComponent(visitId)}`,
  );
}

export function recordLeadVisit(
  token: string,
  leadId: string,
  payload: RecordLeadVisitRequest,
) {
  return request<LeadVisitDetail>(token, `/leads/${encodeURIComponent(leadId)}/visits`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}
