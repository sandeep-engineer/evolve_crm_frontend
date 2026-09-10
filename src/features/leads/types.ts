import type {
  BatchTypePref,
  LeadCommunicationChannel,
  LeadContactOutcome,
  LeadCurrentIntent,
  LeadSource,
  LeadStage,
  LeadStatus,
  LeadTimelineEventType,
} from "@/lib/api/leads";

export type LeadFormState = {
  alternatePhone: string;
  assignedUserId: string;
  batchTypePref: BatchTypePref | "";
  currentIntent: LeadCurrentIntent;
  currentSummary: string;
  dob: string;
  email: string;
  fullName: string;
  goalIds: string[];
  preferredBatchId: string;
  preferredChannel: LeadCommunicationChannel | "";
  preferredDays: number[];
  preferredEndTime: string;
  preferredStartTime: string;
  primaryPhone: string;
  programIds: string[];
  source: LeadSource;
  sourceDetails: string;
};

export type FilterState = {
  assignedUserId: string;
  createdFrom: string;
  createdTo: string;
  followUpFrom: string;
  followUpTo: string;
  programId: string;
  source: LeadSource | "";
  stage: LeadStage | "";
  status: LeadStatus | "";
};

export type LeadProfileTab = "profile" | "timeline" | "visits" | "followups" | "contacts";

export type VisitFormState = {
  discussion: string;
  programIds: string[];
  currentIntent: LeadCurrentIntent | "";
  preferredDays: number[];
  preferredStartTime: string;
  preferredEndTime: string;
  nextActionNote: string;
};

export type FollowUpFormState = {
  scheduledDate: string;
  scheduledTime: string;
  channel: LeadCommunicationChannel;
  reasonDetails: string;
  assignedUserId: string;
};

export type CompleteFollowUpFormState = {
  channel: LeadCommunicationChannel;
  outcome: LeadContactOutcome;
  notes: string;
  includeNextFollowUp: boolean;
  nextFollowUp: FollowUpFormState;
};

export type RescheduleFollowUpFormState = {
  scheduledDate: string;
  scheduledTime: string;
  reason: string;
};

export type CancelFollowUpFormState = {
  reason: string;
};

export type ContactFormState = {
  channel: LeadCommunicationChannel;
  outcome: LeadContactOutcome;
  notes: string;
  includeNextFollowUp: boolean;
  nextFollowUp: FollowUpFormState;
};

export type FollowUpAction = "complete" | "reschedule" | "cancel";

export type TimelineEventOption = { label: string; value: LeadTimelineEventType };
