export type Plan = {
  id: string;
  categoryId: string;
  name: string;
  pricingType: "DURATION_BASED" | "SESSION_BASED";
  durationDays?: number | null;
  daysPattern?: string | null;
  sessionsCount?: number | null;
  price: string | number;
  pricePerDay?: string | number | null;
  discountPercent?: string | number | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
};

export type CreatePlanPayload = {
  categoryId: string;
  name: string;
  pricingType: "DURATION_BASED" | "SESSION_BASED";
  durationDays?: number;
  daysPattern?: string;
  sessionsCount?: number;
  price: number;
  pricePerDay?: number;
  discountPercent?: number;
  status?: "ACTIVE" | "INACTIVE";
};

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

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

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : "Unable to load plans.");
  }

  return data as T;
}

export function getPlans(token: string, query: { categoryId?: string; programId?: string } = {}) {
  const params = new URLSearchParams();
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.programId) params.set("programId", query.programId);
  const value = params.toString();
  return request<Plan[]>(token, `/plans${value ? `?${value}` : ""}`);
}

export function getPlan(token: string, id: string) {
  return request<Plan>(token, `/plans/${id}`);
}

export function createPlan(token: string, payload: CreatePlanPayload) {
  return request<Plan>(token, "/plans", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updatePlan(token: string, id: string, payload: UpdatePlanPayload) {
  return request<Plan>(token, `/plans/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function deletePlan(token: string, id: string) {
  return request<void>(token, `/plans/${id}`, {
    method: "DELETE",
  });
}
