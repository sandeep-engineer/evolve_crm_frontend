export type Staff = {
  id: string;
  branchId?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  role: "ADMIN" | "MANAGER" | "RECEPTIONIST" | "TRAINER";
  status: string;
  createdAt: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export async function getStaff(token: string) {
  const response = await fetch(`${API_BASE_URL}/staff`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : "Unable to load staff.");
  }

  return data as Staff[];
}
