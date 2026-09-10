import type { LeadSummary } from "@/lib/api/leads";

export function formatEnum(value?: string | null) {
  return value ? value.split("_").map((part) => part[0] + part.slice(1).toLowerCase()).join(" ") : "";
}

export function formatDate(value?: string | null, withTime = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

export function phoneHref(phone?: string | null) {
  return phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : undefined;
}

export function whatsappHref(phone?: string | null) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
}

export type FollowUpGroup = "overdue" | "today" | "upcoming" | "unscheduled";

export function groupLeads(leads: LeadSummary[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const groups: Record<FollowUpGroup, LeadSummary[]> = { overdue: [], today: [], upcoming: [], unscheduled: [] };
  leads.forEach((lead) => {
    if (!lead.nextFollowUpAt) return groups.unscheduled.push(lead);
    const followUp = new Date(lead.nextFollowUpAt);
    if (followUp < today) groups.overdue.push(lead);
    else if (followUp < tomorrow) groups.today.push(lead);
    else groups.upcoming.push(lead);
  });
  return groups;
}

export function localDateTime(date: string, time: string) {
  if (!date || !time) throw new Error("Choose a date and time.");
  const value = new Date(`${date}T${time}`);
  if (Number.isNaN(value.getTime()) || value <= new Date()) throw new Error("Choose a future date and time.");
  return value.toISOString();
}
