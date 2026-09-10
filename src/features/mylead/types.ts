import type { LeadSource, LeadStage, LeadStatus } from "@/lib/api/leads";

export type MyleadFilters = {
  createdFrom: string;
  createdTo: string;
  programId: string;
  source: LeadSource | "";
  stage: LeadStage | "";
  status: LeadStatus | "";
};

export type TaskKind = "followup" | "contact" | "visit" | "note" | "lost" | "reengage" | "archive" | "reactivate";

export type TaskDraft = {
  channel: "PHONE_CALL" | "WHATSAPP" | "SMS" | "EMAIL" | "IN_PERSON";
  date: string;
  details: string;
  outcome: "INTERESTED" | "NEEDS_TIME" | "CALLBACK_REQUESTED" | "NO_ANSWER" | "UNREACHABLE" | "VISIT_PLANNED" | "TRIAL_REQUESTED" | "READY_TO_JOIN" | "NOT_INTERESTED";
  reason: string;
  time: string;
};

export const emptyFilters: MyleadFilters = { createdFrom: "", createdTo: "", programId: "", source: "", stage: "", status: "" };
export const emptyTask: TaskDraft = { channel: "PHONE_CALL", date: "", details: "", outcome: "INTERESTED", reason: "", time: "" };
