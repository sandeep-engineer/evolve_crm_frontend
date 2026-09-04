export type Tag = {
  id: string;
  name: string;
  color?: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export async function getTags(token: string) {
  const response = await fetch(`${API_BASE_URL}/tags`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.message === "string" ? data.message : "Unable to load tags.";
    throw new Error(message);
  }

  return data as Tag[];
}
