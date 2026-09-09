import { API_BASE_URL } from "@/lib/api/config";

export type Goal = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
};

export class GoalApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GoalApiError";
  }
}

async function request<T>(token: string, path: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        typeof data?.message === "string"
          ? data.message
          : "Unable to load goals.";
      throw new GoalApiError(message, response.status);
    }

    return data as T;
  } catch (error) {
    if (error instanceof GoalApiError) throw error;
    throw new GoalApiError("Unable to reach the server. Please try again.", 0);
  }
}

export function getGoals(token: string) {
  return request<Goal[]>(token, "/goals");
}
