import { API_BASE_URL } from "@/lib/api/config";

export type Batch = {
  id: string;
  branchId?: string | null;
  programId: string;
  name: string;
  startTime: string;
  endTime: string;
  daysPattern: string;
  trainerId?: string | null;
  capacity: number;
  status: "ACTIVE" | "FULL" | "INACTIVE" | "CANCELLED";
  createdAt: string;
};

export type BatchOccupancy = {
  batchId: string;
  capacity: number;
  admitted: number;
  availableSeats: number;
};

export type AssignedBatchStaff = {
  id: string;
  batchId: string;
  staffId: string;
  staff?: {
    id: string;
    fullName: string;
    role: string;
    phone?: string;
    email?: string | null;
  };
  createdAt?: string;
};

export type CreateBatchPayload = {
  branchId?: string;
  programId: string;
  name: string;
  startTime: string;
  endTime: string;
  daysPattern: string;
  trainerId?: string;
  capacity: number;
  status?: Batch["status"];
};

export type UpdateBatchPayload = Partial<CreateBatchPayload>;

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

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string" ? data.message : "Batch request failed.",
    );
  }

  return data as T;
}

export function getBatches(token: string, programId?: string) {
  const query = programId ? `?programId=${encodeURIComponent(programId)}` : "";
  return request<Batch[]>(token, `/batches${query}`);
}

export function getBatch(token: string, id: string) {
  return request<Batch>(token, `/batches/${id}`);
}

export function createBatch(token: string, payload: CreateBatchPayload) {
  return request<Batch>(token, "/batches", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateBatch(
  token: string,
  id: string,
  payload: UpdateBatchPayload,
) {
  return request<Batch>(token, `/batches/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function deleteBatch(token: string, id: string) {
  return request<void>(token, `/batches/${id}`, {
    method: "DELETE",
  });
}

export function getBatchOccupancy(token: string, id: string) {
  return request<BatchOccupancy>(token, `/batches/${id}/occupancy`);
}

export function getBatchStaff(token: string, id: string) {
  return request<AssignedBatchStaff[]>(token, `/batches/${id}/staff`);
}

export function assignStaffToBatch(token: string, id: string, staffId: string) {
  return request<AssignedBatchStaff>(token, `/batches/${id}/staff`, {
    body: JSON.stringify({ staffId }),
    method: "POST",
  });
}

export function unassignStaffFromBatch(
  token: string,
  id: string,
  staffId: string,
) {
  return request<{ removed: boolean }>(token, `/batches/${id}/staff/${staffId}`, {
    method: "DELETE",
  });
}
