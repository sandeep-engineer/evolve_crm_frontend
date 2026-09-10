import { API_BASE_URL } from "@/lib/api/config";
import { LeadApiError, type LeadDetail } from "@/lib/api/leads";

export type LeadLostReason = "NOT_INTERESTED" | "PRICE_TOO_HIGH" | "LOCATION_ISSUE" | "TIMING_ISSUE" | "JOINED_COMPETITOR" | "UNREACHABLE" | "DUPLICATE" | "INVALID_CONTACT" | "OTHER";

async function command<T>(token: string, path: string, body: object): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = typeof data?.message === "string" ? data.message : "Unable to complete this Lead action.";
      throw new LeadApiError(message, response.status, data ?? undefined);
    }
    return data as T;
  } catch (error) {
    if (error instanceof LeadApiError) throw error;
    throw new LeadApiError("Unable to reach the server. Please try again.", 0);
  }
}

export function addLeadNote(token: string, leadId: string, body: string) {
  return command(token, `/leads/${encodeURIComponent(leadId)}/notes`, { body });
}
export function markLeadLost(token: string, leadId: string, reason: LeadLostReason, explanation?: string) {
  return command<LeadDetail>(token, `/leads/${encodeURIComponent(leadId)}/mark-lost`, { reason, ...(explanation ? { explanation } : {}) });
}
export function reengageLead(token: string, leadId: string, note?: string) {
  return command<LeadDetail>(token, `/leads/${encodeURIComponent(leadId)}/re-engage`, note ? { note } : {});
}
export function archiveLead(token: string, leadId: string, reason: string) {
  return command<LeadDetail>(token, `/leads/${encodeURIComponent(leadId)}/archive`, { reason });
}
export function reactivateLead(token: string, leadId: string, reason: string) {
  return command<LeadDetail>(token, `/leads/${encodeURIComponent(leadId)}/reactivate`, { reason });
}
