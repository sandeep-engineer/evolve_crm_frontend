import type { Batch } from "@/lib/api/batches";
import type { Goal } from "@/lib/api/goals";
import type {
  CancelLeadFollowUpRequest,
  CompleteLeadFollowUpRequest,
  CreateLeadRequest,
  LeadAssigneeOption,
  LeadCommunicationChannel,
  LeadDetail,
  LeadFollowUpScheduleRequest,
  RecordLeadContactRequest,
  RecordLeadVisitRequest,
  RescheduleLeadFollowUpRequest,
  ScheduleLeadFollowUpRequest,
  UpdateLeadRequest,
} from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import { emptyContactForm, emptyFollowUpForm } from "../constants";
import type {
  CancelFollowUpFormState,
  CompleteFollowUpFormState,
  ContactFormState,
  FollowUpFormState,
  LeadFormState,
  RescheduleFollowUpFormState,
  VisitFormState,
} from "../types";
import { dateInputValue, timeInputValue } from "./lead-formatters";

export function buildCreatePayload(
  form: LeadFormState,
  branchBatches: Batch[],
  activePrograms: Program[],
  activeGoals: Goal[],
  assignees: LeadAssigneeOption[],
): CreateLeadRequest {
  const fullName = form.fullName.trim();
  if (fullName.length < 2) throw new Error("Enter the Lead's full name.");

  const primaryPhone = normalizeIndianMobile(form.primaryPhone);
  if (!primaryPhone) throw new Error("Enter a valid Indian primary phone number.");

  const alternatePhone = form.alternatePhone.trim()
    ? normalizeIndianMobile(form.alternatePhone)
    : null;
  if (form.alternatePhone.trim() && !alternatePhone) {
    throw new Error("Enter a valid Indian alternate phone number.");
  }
  if (alternatePhone && alternatePhone === primaryPhone) {
    throw new Error("Alternate phone must be different from the primary phone.");
  }

  const email = form.email.trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (Boolean(form.preferredStartTime) !== Boolean(form.preferredEndTime)) {
    throw new Error("Enter both preferred start and end times.");
  }
  if (
    form.preferredStartTime &&
    form.preferredEndTime &&
    form.preferredStartTime >= form.preferredEndTime
  ) {
    throw new Error("Preferred end time must be after the start time.");
  }

  const allowedBatchIds = new Set(branchBatches.map((batch) => batch.id));
  const allowedProgramIds = new Set(activePrograms.map((program) => program.id));
  const allowedGoalIds = new Set(activeGoals.map((goal) => goal.id));
  const allowedAssigneeIds = new Set(assignees.map((assignee) => assignee.userId));
  const programIds = form.programIds.filter((programId) => allowedProgramIds.has(programId));
  const goalIds = form.goalIds.filter((goalId) => allowedGoalIds.has(goalId));
  if (form.assignedUserId && !allowedAssigneeIds.has(form.assignedUserId)) {
    throw new Error("Choose an eligible assignee from the scoped Branch list.");
  }

  const payload: CreateLeadRequest = {
    currentIntent: form.currentIntent,
    fullName,
    primaryPhone,
    source: form.source,
  };

  if (alternatePhone) payload.alternatePhone = alternatePhone;
  if (email) payload.email = email;
  if (form.dob) payload.dob = form.dob;
  if (form.sourceDetails.trim()) payload.sourceDetails = form.sourceDetails.trim();
  if (form.preferredChannel) payload.preferredChannel = form.preferredChannel;
  if (form.batchTypePref) payload.batchTypePref = form.batchTypePref;
  if (form.preferredBatchId && allowedBatchIds.has(form.preferredBatchId)) {
    payload.preferredBatchId = form.preferredBatchId;
  }
  if (form.preferredDays.length) payload.preferredDays = form.preferredDays;
  if (form.preferredStartTime) payload.preferredStartTime = form.preferredStartTime;
  if (form.preferredEndTime) payload.preferredEndTime = form.preferredEndTime;
  if (programIds.length) payload.programIds = programIds;
  if (goalIds.length) payload.goalIds = goalIds;
  if (form.assignedUserId) payload.assignedUserId = form.assignedUserId;
  if (form.currentSummary.trim()) payload.currentSummary = form.currentSummary.trim();

  return payload;
}

export function buildUpdatePayload(
  form: LeadFormState,
  branchBatches: Batch[],
  activePrograms: Program[],
  activeGoals: Goal[],
): UpdateLeadRequest {
  const fullName = form.fullName.trim();
  if (fullName.length < 2) throw new Error("Enter the Lead's full name.");

  const primaryPhone = normalizeIndianMobile(form.primaryPhone);
  if (!primaryPhone) throw new Error("Enter a valid Indian primary phone number.");

  const alternatePhone = form.alternatePhone.trim()
    ? normalizeIndianMobile(form.alternatePhone)
    : null;
  if (form.alternatePhone.trim() && !alternatePhone) {
    throw new Error("Enter a valid Indian alternate phone number.");
  }
  if (alternatePhone && alternatePhone === primaryPhone) {
    throw new Error("Alternate phone must be different from the primary phone.");
  }

  const email = form.email.trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (Boolean(form.preferredStartTime) !== Boolean(form.preferredEndTime)) {
    throw new Error("Enter both preferred start and end times.");
  }
  if (
    form.preferredStartTime &&
    form.preferredEndTime &&
    form.preferredStartTime >= form.preferredEndTime
  ) {
    throw new Error("Preferred end time must be after the start time.");
  }

  const allowedBatchIds = new Set(branchBatches.map((batch) => batch.id));
  const allowedProgramIds = new Set(activePrograms.map((program) => program.id));
  const allowedGoalIds = new Set(activeGoals.map((goal) => goal.id));
  if (form.preferredBatchId && !allowedBatchIds.has(form.preferredBatchId)) {
    throw new Error("Choose a preferred Batch from this Lead's Branch.");
  }

  return {
    alternatePhone,
    batchTypePref: form.batchTypePref || null,
    currentIntent: form.currentIntent,
    currentSummary: form.currentSummary.trim() || null,
    dob: form.dob || null,
    email: email || null,
    fullName,
    goalIds: form.goalIds.filter((goalId) => allowedGoalIds.has(goalId)),
    preferredBatchId: form.preferredBatchId || null,
    preferredChannel: form.preferredChannel || null,
    preferredDays: form.preferredDays,
    preferredEndTime: form.preferredEndTime || null,
    preferredStartTime: form.preferredStartTime || null,
    primaryPhone,
    programIds: form.programIds.filter((programId) => allowedProgramIds.has(programId)),
    source: form.source,
    sourceDetails: form.sourceDetails.trim() || null,
  };
}

export function buildVisitPayload(
  form: VisitFormState,
  activePrograms: Program[],
): RecordLeadVisitRequest {
  const discussion = form.discussion.trim();
  if (!discussion) throw new Error("Enter the Visit discussion.");
  if (discussion.length > 2000) throw new Error("Discussion must be 2000 characters or fewer.");

  const nextActionNote = form.nextActionNote.trim();
  if (nextActionNote.length > 1000) throw new Error("Next-action note must be 1000 characters or fewer.");

  if (Boolean(form.preferredStartTime) !== Boolean(form.preferredEndTime)) {
    throw new Error("Enter both preferred start and end times.");
  }
  if (
    form.preferredStartTime &&
    form.preferredEndTime &&
    form.preferredStartTime >= form.preferredEndTime
  ) {
    throw new Error("Preferred end time must be after the start time.");
  }

  const allowedProgramIds = new Set(activePrograms.map((program) => program.id));
  const programIds = form.programIds.filter((programId) => allowedProgramIds.has(programId));

  return {
    currentIntent: form.currentIntent || null,
    discussion,
    nextActionNote: nextActionNote || null,
    preferredDays: form.preferredDays.length ? form.preferredDays : null,
    preferredEndTime: form.preferredEndTime || null,
    preferredStartTime: form.preferredStartTime || null,
    programIds,
  };
}

export function buildFollowUpPayload(
  form: FollowUpFormState,
  assignees: LeadAssigneeOption[],
): ScheduleLeadFollowUpRequest {
  return buildFollowUpSchedulePayload(form, assignees);
}

export function buildCompleteFollowUpPayload(
  form: CompleteFollowUpFormState,
  assignees: LeadAssigneeOption[],
): CompleteLeadFollowUpRequest {
  const notes = form.notes.trim();
  if (!notes) throw new Error("Enter Contact notes before completing the Follow-up.");
  if (notes.length > 2000) throw new Error("Contact notes must be 2000 characters or fewer.");
  if (form.outcome === "CALLBACK_REQUESTED" && !form.includeNextFollowUp) {
    throw new Error("Add the required next Follow-up for a callback request.");
  }

  const payload: CompleteLeadFollowUpRequest = {
    channel: form.channel,
    notes,
    outcome: form.outcome,
  };

  if (form.includeNextFollowUp) {
    payload.nextFollowUp = buildFollowUpSchedulePayload(form.nextFollowUp, assignees);
  }

  return payload;
}

export function buildReschedulePayload(form: RescheduleFollowUpFormState): RescheduleLeadFollowUpRequest {
  const scheduledAt = localDateTimeToOffsetIso(form.scheduledDate, form.scheduledTime);
  if (!scheduledAt) throw new Error("Choose a valid future date and time.");

  const reason = form.reason.trim();
  if (!reason) throw new Error("Enter the reschedule reason.");
  if (reason.length > 1000) throw new Error("Reschedule reason must be 1000 characters or fewer.");

  return { reason, scheduledAt };
}

export function buildCancelPayload(form: CancelFollowUpFormState): CancelLeadFollowUpRequest {
  const reason = form.reason.trim();
  if (!reason) throw new Error("Enter the cancellation reason.");
  if (reason.length > 1000) throw new Error("Cancellation reason must be 1000 characters or fewer.");
  return { reason };
}

export function buildContactPayload(
  form: ContactFormState,
  assignees: LeadAssigneeOption[],
): RecordLeadContactRequest {
  const notes = form.notes.trim();
  if (!notes) throw new Error("Enter Contact notes.");
  if (notes.length > 2000) throw new Error("Contact notes must be 2000 characters or fewer.");
  if (form.outcome === "CALLBACK_REQUESTED" && !form.includeNextFollowUp) {
    throw new Error("Add the required next Follow-up for a callback request.");
  }

  const payload: RecordLeadContactRequest = {
    channel: form.channel,
    notes,
    outcome: form.outcome,
  };

  if (form.includeNextFollowUp) {
    payload.nextFollowUp = buildFollowUpSchedulePayload(form.nextFollowUp, assignees);
  }

  return payload;
}

function buildFollowUpSchedulePayload(
  form: FollowUpFormState,
  assignees: LeadAssigneeOption[],
): LeadFollowUpScheduleRequest {
  const scheduledAt = localDateTimeToOffsetIso(form.scheduledDate, form.scheduledTime);
  if (!scheduledAt) throw new Error("Choose a valid future date and time.");

  const reasonDetails = form.reasonDetails.trim();
  if (!reasonDetails) throw new Error("Enter Follow-up reason details.");
  if (reasonDetails.length > 1000) throw new Error("Follow-up reason details must be 1000 characters or fewer.");

  const allowedAssigneeIds = new Set(assignees.map((assignee) => assignee.userId));
  if (form.assignedUserId && !allowedAssigneeIds.has(form.assignedUserId)) {
    throw new Error("Choose an eligible assignee from the scoped Branch list.");
  }

  const payload: LeadFollowUpScheduleRequest = {
    channel: form.channel,
    reasonDetails,
    scheduledAt,
  };

  if (form.assignedUserId) payload.assignedUserId = form.assignedUserId;
  return payload;
}

function localDateTimeToOffsetIso(date: string, time: string) {
  if (!date || !time) return null;
  const localDate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(localDate.getTime()) || localDate.getTime() <= Date.now()) return null;
  const offsetMinutes = -localDate.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const minutes = String(absoluteOffset % 60).padStart(2, "0");
  return `${date}T${time}:00${sign}${hours}:${minutes}`;
}

export function defaultFollowUpForm(channel?: LeadCommunicationChannel | null): FollowUpFormState {
  return {
    ...emptyFollowUpForm,
    channel: channel ?? "PHONE_CALL",
  };
}

export function defaultContactForm(channel?: LeadCommunicationChannel | null): ContactFormState {
  return {
    ...emptyContactForm,
    channel: channel ?? "PHONE_CALL",
    nextFollowUp: defaultFollowUpForm(channel),
  };
}

export function leadToForm(lead: LeadDetail): LeadFormState {
  return {
    alternatePhone: lead.alternatePhone ?? "",
    assignedUserId: "",
    batchTypePref: lead.batchTypePref ?? "",
    currentIntent: lead.currentIntent,
    currentSummary: lead.currentSummary ?? "",
    dob: dateInputValue(lead.dob),
    email: lead.email ?? "",
    fullName: lead.fullName,
    goalIds: lead.goals.map((goal) => goal.goalId),
    preferredBatchId: lead.preferredBatchId ?? "",
    preferredChannel: lead.preferredChannel ?? "",
    preferredDays: lead.preferredDays ?? [],
    preferredEndTime: timeInputValue(lead.preferredEndTime),
    preferredStartTime: timeInputValue(lead.preferredStartTime),
    primaryPhone: lead.primaryPhone ?? "",
    programIds: lead.interests.map((interest) => interest.programId),
    source: lead.source,
    sourceDetails: lead.sourceDetails ?? "",
  };
}

export function normalizeIndianMobile(input: string) {
  const raw = input.trim();
  const digits = raw.replace(/\D/g, "");
  const withoutCountry =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 10
        ? digits
        : "";

  if (!/^[6-9]\d{9}$/.test(withoutCountry)) return null;
  return `+91${withoutCountry}`;
}
