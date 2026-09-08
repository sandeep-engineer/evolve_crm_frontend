import { API_BASE_URL } from "@/lib/api/config";

export type OrganizationStatus = "ACTIVE" | "INACTIVE";
export type OrganizationOwnerStatus =
  | "PENDING_SETUP"
  | "ACTIVE"
  | "SUSPENDED"
  | "INACTIVE";

export type Organization = {
  id: string;
  name: string;
  status: OrganizationStatus;
  createdByUserId: string;
  updatedByUserId: string | null;
  deactivatedByUserId: string | null;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedOrganizations = {
  data: Organization[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateOrganizationPayload = {
  name: string;
};

export type UpdateOrganizationPayload = Partial<CreateOrganizationPayload>;

export type OrganizationOwnerCreator = {
  id: string;
  name: string;
  email: string;
};

export type OrganizationOwner = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ORGANIZATION_OWNER";
  status: OrganizationOwnerStatus;
  organizationId: string;
  branchId: null;
  staffId: string | null;
  createdByUserId: string | null;
  createdBy: OrganizationOwnerCreator | null;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrganizationOwnerPayload = {
  name: string;
  email: string;
  phone: string;
};

export type CreateOrganizationOwnerResponse = {
  user: OrganizationOwner;
  initialPassword: string;
};

export type UpdateOrganizationOwnerPayload = Partial<CreateOrganizationOwnerPayload>;

export type ListOrganizationOwnersQuery = {
  limit?: number;
  page?: number;
  search?: string;
  status?: OrganizationOwnerStatus;
};

export type PaginatedOrganizationOwners = {
  items: OrganizationOwner[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListOrganizationsQuery = {
  limit?: number;
  page?: number;
  search?: string;
  status?: OrganizationStatus;
};

export class OrganizationApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OrganizationApiError";
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

  if (status === 400) return "Please check the organization details and try again.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to manage organizations.";
  if (status === 404) return "This organization could not be found.";
  return fallback;
}

function ownerMessageForStatus(status: number, fallback: string) {
  if (status === 400) return "Please check the Organization Owner details and try again.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to manage Organization Owners.";
  if (status === 404) return "This Organization Owner could not be found for the selected Organization.";
  if (status === 409) return "The owner could not be updated. Their email or phone may already be in use, or the requested status change is not available.";
  return fallback;
}

async function request<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
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
      throw new OrganizationApiError(
        messageForStatus(response.status, data, "Unable to complete the organization request."),
        response.status,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof OrganizationApiError) throw error;
    throw new OrganizationApiError("Unable to reach the server. Please try again.", 0);
  }
}

export function getOrganizations(token: string, query: ListOrganizationsQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.status) params.set("status", query.status);
  const suffix = params.size ? `?${params.toString()}` : "";

  return request<PaginatedOrganizations>(`/organizations${suffix}`, token);
}

export function getOrganization(token: string, id: string) {
  return request<Organization>(`/organizations/${encodeURIComponent(id)}`, token);
}

export function createOrganization(token: string, payload: CreateOrganizationPayload) {
  return request<Organization>("/organizations", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOrganization(
  token: string,
  id: string,
  payload: UpdateOrganizationPayload,
) {
  return request<Organization>(`/organizations/${encodeURIComponent(id)}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivateOrganization(token: string, id: string) {
  return request<Organization>(
    `/organizations/${encodeURIComponent(id)}/deactivate`,
    token,
    { method: "PATCH" },
  );
}

export function reactivateOrganization(token: string, id: string) {
  return request<Organization>(
    `/organizations/${encodeURIComponent(id)}/reactivate`,
    token,
    { method: "PATCH" },
  );
}

function ownerPath(organizationId: string, userId?: string) {
  const organizationPath = `/organizations/${encodeURIComponent(organizationId)}/owners`;
  return userId ? `${organizationPath}/${encodeURIComponent(userId)}` : organizationPath;
}

async function ownerRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
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
      throw new OrganizationApiError(
        ownerMessageForStatus(response.status, "Unable to complete the Organization Owner request."),
        response.status,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof OrganizationApiError) throw error;
    throw new OrganizationApiError("Unable to reach the server. Please try again.", 0);
  }
}

export function createOrganizationOwner(
  token: string,
  organizationId: string,
  payload: CreateOrganizationOwnerPayload,
) {
  return ownerRequest<CreateOrganizationOwnerResponse>(ownerPath(organizationId), token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listOrganizationOwners(
  token: string,
  organizationId: string,
  query: ListOrganizationOwnersQuery = {},
) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.status) params.set("status", query.status);
  const suffix = params.size ? `?${params.toString()}` : "";

  return ownerRequest<PaginatedOrganizationOwners>(`${ownerPath(organizationId)}${suffix}`, token);
}

export function getOrganizationOwner(token: string, organizationId: string, userId: string) {
  return ownerRequest<OrganizationOwner>(ownerPath(organizationId, userId), token);
}

export function updateOrganizationOwner(
  token: string,
  organizationId: string,
  userId: string,
  payload: UpdateOrganizationOwnerPayload,
) {
  return ownerRequest<OrganizationOwner>(ownerPath(organizationId, userId), token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivateOrganizationOwner(token: string, organizationId: string, userId: string) {
  return ownerRequest<OrganizationOwner>(`${ownerPath(organizationId, userId)}/deactivate`, token, {
    method: "PATCH",
  });
}

export function reactivateOrganizationOwner(token: string, organizationId: string, userId: string) {
  return ownerRequest<OrganizationOwner>(`${ownerPath(organizationId, userId)}/reactivate`, token, {
    method: "PATCH",
  });
}
