export type Program = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type CreateProgramPayload = {
  name: string;
  description?: string;
  isActive?: boolean;
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
    throw new Error(typeof data?.message === "string" ? data.message : "Unable to load programs.");
  }

  return data as T;
}

export function getPrograms(token: string) {
  return request<Program[]>(token, "/programs");
}

export function getProgram(token: string, id: string) {
  return request<Program>(token, `/programs/${id}`);
}

export function createProgram(token: string, payload: CreateProgramPayload) {
  return request<Program>(token, "/programs", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateProgram(
  token: string,
  id: string,
  payload: Partial<CreateProgramPayload>,
) {
  return request<Program>(token, `/programs/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function deleteProgram(token: string, id: string) {
  return request<void>(token, `/programs/${id}`, {
    method: "DELETE",
  });
}
