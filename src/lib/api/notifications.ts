import { API_BASE_URL } from "@/lib/api/config";
import type { LeadCommunicationChannel, LeadFollowUpStatus, LeadStage, LeadStatus } from "@/lib/api/leads";
import { clearSession } from "@/lib/session";

export type NotificationType =
  | "LEAD_FOLLOW_UP_MORNING"
  | "LEAD_FOLLOW_UP_DUE";

export type NotificationTarget = {
  type: "LEAD_FOLLOW_UP";
  leadId: string;
  followUpId: string;
};

export type NotificationLeadSummary = {
  id: string;
  fullName: string;
  stage: LeadStage;
  status: LeadStatus;
};

export type NotificationFollowUpSummary = {
  id: string;
  scheduledAt: string;
  channel: LeadCommunicationChannel;
  status: LeadFollowUpStatus;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  scheduledFor: string;
  readAt: string | null;
  createdAt: string;
  target: NotificationTarget;
  lead: NotificationLeadSummary | null;
  followUp: NotificationFollowUpSummary | null;
};

export type NotificationListQuery = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedNotifications = {
  data: NotificationItem[];
  meta: PaginationMeta;
};

export type UnreadNotificationCount = {
  unreadCount: number;
};

export type MarkAllNotificationsReadResult = {
  updatedCount: number;
};

export class NotificationApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "NotificationApiError";
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

  if (status === 400) return "Please check the notification request and try again.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "Notifications are not available for this account.";
  if (status === 404) return "This notification could not be found.";
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
      if (response.status === 401) clearSession();
      throw new NotificationApiError(
        messageForStatus(response.status, data, "Unable to complete the notification request."),
        response.status,
      );
    }

    return assertObject<T>(data);
  } catch (error) {
    if (error instanceof NotificationApiError) throw error;
    throw new NotificationApiError("Unable to reach the server. Please try again.", 0);
  }
}

function assertObject<T>(data: unknown): T {
  if (!data || typeof data !== "object") {
    throw new NotificationApiError("The server returned an unexpected notification response.", 0);
  }
  return data as T;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNotificationItem(value: unknown): value is NotificationItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<NotificationItem>;
  return (
    isString(item.id) &&
    (item.type === "LEAD_FOLLOW_UP_MORNING" || item.type === "LEAD_FOLLOW_UP_DUE") &&
    isString(item.scheduledFor) &&
    (item.readAt === null || isString(item.readAt)) &&
    isString(item.createdAt) &&
    !!item.target &&
    item.target.type === "LEAD_FOLLOW_UP" &&
    isString(item.target.leadId) &&
    isString(item.target.followUpId)
  );
}

function assertNotificationItem(data: unknown): NotificationItem {
  if (!isNotificationItem(data)) {
    throw new NotificationApiError("The server returned an unexpected notification response.", 0);
  }
  return data;
}

function assertNotificationList(data: unknown): PaginatedNotifications {
  const value = assertObject<Partial<PaginatedNotifications>>(data);
  if (
    !Array.isArray(value.data) ||
    !value.data.every(isNotificationItem) ||
    !value.meta ||
    typeof value.meta.page !== "number" ||
    typeof value.meta.limit !== "number" ||
    typeof value.meta.total !== "number" ||
    typeof value.meta.totalPages !== "number"
  ) {
    throw new NotificationApiError("The server returned an unexpected notification response.", 0);
  }
  return value as PaginatedNotifications;
}

function assertUnreadCount(data: unknown): UnreadNotificationCount {
  const value = assertObject<Partial<UnreadNotificationCount>>(data);
  if (typeof value.unreadCount !== "number") {
    throw new NotificationApiError("The server returned an unexpected notification response.", 0);
  }
  return { unreadCount: value.unreadCount };
}

function assertMarkAllResult(data: unknown): MarkAllNotificationsReadResult {
  const value = assertObject<Partial<MarkAllNotificationsReadResult>>(data);
  if (typeof value.updatedCount !== "number") {
    throw new NotificationApiError("The server returned an unexpected notification response.", 0);
  }
  return { updatedCount: value.updatedCount };
}

function queryString(query: NotificationListQuery) {
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  return search.size ? `?${search.toString()}` : "";
}

export async function listNotifications(token: string, query: NotificationListQuery = {}) {
  return assertNotificationList(await request<unknown>(`/notifications${queryString(query)}`, token));
}

export async function getUnreadNotificationCount(token: string) {
  return assertUnreadCount(await request<unknown>("/notifications/unread-count", token));
}

export async function markNotificationRead(token: string, id: string) {
  return assertNotificationItem(
    await request<unknown>(`/notifications/${encodeURIComponent(id)}/read`, token, {
      method: "PATCH",
    }),
  );
}

export async function markAllNotificationsRead(token: string) {
  return assertMarkAllResult(
    await request<unknown>("/notifications/read-all", token, {
      method: "PATCH",
    }),
  );
}
