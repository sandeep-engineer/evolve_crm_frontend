import type React from "react";
import type { AuthUser } from "@/lib/api/auth";
import type { Batch } from "@/lib/api/batches";
import type { Goal } from "@/lib/api/goals";
import type { LeadDetail, LeadFollowUpSummary, LeadStatus, LeadVisitSummary } from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import { dayOptions } from "../constants";
import type { FollowUpAction } from "../types";

export function labelFor<T extends string>(options: Array<{ label: string; value: T }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? formatEnum(value);
}

export function batchNameFor(batchId: string | null, batches: Batch[]) {
  if (!batchId) return "Not set";
  const batch = batches.find((item) => item.id === batchId);
  return batch ? `${batch.name} (${timeRange(batch)})` : shortId(batchId);
}

export function formatLeadPrograms(lead: LeadDetail, programs: Program[]) {
  if (!lead.interests.length) return "Not set";
  return lead.interests
    .map((interest) => interest.program?.name ?? programs.find((program) => program.id === interest.programId)?.name ?? shortId(interest.programId))
    .join(", ");
}

export function formatLeadGoals(lead: LeadDetail, goals: Goal[]) {
  if (!lead.goals.length) return "Not set";
  return lead.goals
    .map((goal) => goal.goal?.name ?? goals.find((item) => item.id === goal.goalId)?.name ?? shortId(goal.goalId))
    .join(", ");
}

export function formatDays(days?: number[] | null) {
  if (!days?.length) return "Not set";
  const labels = new Map(dayOptions.map((day) => [day.value, day.label]));
  return days.map((day) => labels.get(day) ?? String(day)).join(", ");
}

export function formatPreferredTime(start?: string | null, end?: string | null) {
  if (!start && !end) return "Not set";
  return `${timeInputValue(start) || "Not set"}-${timeInputValue(end) || "Not set"}`;
}

export function formatVisitPrograms(programs: LeadVisitSummary["programs"]) {
  if (!programs.length) return "Not set";
  return programs.map((program) => program.programNameSnapshot ?? shortId(program.programId)).join(", ");
}

export function formatSafeUser(user?: LeadDetail["assignedUser"] | null) {
  if (!user) return "Not set";
  return `${user.name} (${formatEnum(user.role)})`;
}

export function isEmptyValue(value: React.ReactNode) {
  return value === null || value === undefined || value === "";
}

export function scopeDescription(role?: AuthUser["role"]) {
  if (role === "CRM_OWNER") return "Choose the Organization and Branch before requesting Leads.";
  if (role === "ORGANIZATION_OWNER") return "Choose one of your active Branches.";
  if (role === "BRANCH_ADMIN" || role === "RECEPTIONIST") {
    return "Your authenticated Branch scope is applied automatically.";
  }
  return "Lead access depends on your authenticated role.";
}

export function formatEnum(value?: string | null) {
  if (!value) return "None";
  return value
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
}

export function statusTone(status: LeadStatus) {
  if (status === "FOLLOW_UP") return "pending";
  if (status === "ARCHIVED" || status === "DORMANT") return "lost";
  return "active";
}

export function followUpStatusTone(followUp: LeadFollowUpSummary) {
  if (followUp.isOverdue) return "lost";
  if (followUp.status === "PENDING") return "pending";
  if (followUp.status === "COMPLETED") return "active";
  return "lost";
}

export function followUpActionTitle(action: FollowUpAction) {
  if (action === "complete") return "Complete Follow-up";
  if (action === "reschedule") return "Reschedule Follow-up";
  return "Cancel Follow-up";
}

export function avatarTone(id: string) {
  const tones = ["blue", "green", "orange", "purple", "red", "teal"] as const;
  return tones[id.charCodeAt(0) % tones.length];
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateOnly(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export function dateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function timeInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

export function timeRange(batch: Batch) {
  return `${batch.startTime.slice(0, 5)}-${batch.endTime.slice(0, 5)}`;
}

export function dateFilterValue(value: string, edge: "start" | "end") {
  if (!value) return undefined;
  return `${value}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}Z`;
}

export function shortId(id: string) {
  if (!id) return "";
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}
