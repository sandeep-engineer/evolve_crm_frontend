import { API_BASE_URL } from "@/lib/api/config";

export type UserRole =
  | "CRM_OWNER"
  | "ORGANIZATION_OWNER"
  | "BRANCH_ADMIN"
  | "RECEPTIONIST"
  | "LEAD_CALLER";

export type UserStatus = "PENDING_SETUP" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  organizationId: string | null;
  branchId: string | null;
  staffId: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : "Unable to sign in. Check your email and password.";
    throw new AuthApiError(message, response.status);
  }

  return data as LoginResponse;
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : "Unable to load your profile.";
    throw new AuthApiError(message, response.status);
  }

  return data as AuthUser;
}
