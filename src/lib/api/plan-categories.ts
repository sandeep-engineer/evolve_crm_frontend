export type PlanCategory = {
  id: string;
  programId: string;
  name: string;
  createdAt: string;
};

export type CreatePlanCategoryPayload = {
  programId: string;
  name: string;
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

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string" ? data.message : "Unable to load plan categories.",
    );
  }

  return data as T;
}

export function getPlanCategories(token: string, programId?: string) {
  const query = programId ? `?programId=${encodeURIComponent(programId)}` : "";
  return request<PlanCategory[]>(token, `/plan-categories${query}`);
}

export function getPlanCategory(token: string, id: string) {
  return request<PlanCategory>(token, `/plan-categories/${id}`);
}

export function createPlanCategory(
  token: string,
  payload: CreatePlanCategoryPayload,
) {
  return request<PlanCategory>(token, "/plan-categories", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updatePlanCategory(
  token: string,
  id: string,
  payload: Partial<CreatePlanCategoryPayload>,
) {
  return request<PlanCategory>(token, `/plan-categories/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function deletePlanCategory(token: string, id: string) {
  return request<void>(token, `/plan-categories/${id}`, {
    method: "DELETE",
  });
}
