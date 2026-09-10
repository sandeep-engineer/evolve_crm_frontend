import type {
  BatchTypePref,
  LeadCommunicationChannel,
  LeadContactOutcome,
  LeadCurrentIntent,
  LeadFollowUpStatus,
  LeadSource,
  LeadStage,
  LeadStatus,
} from "@/lib/api/leads";
import type {
  CancelFollowUpFormState,
  CompleteFollowUpFormState,
  ContactFormState,
  FilterState,
  FollowUpFormState,
  LeadFormState,
  RescheduleFollowUpFormState,
  TimelineEventOption,
  VisitFormState,
} from "./types";

export const emptyForm: LeadFormState = {
  alternatePhone: "",
  assignedUserId: "",
  batchTypePref: "",
  currentIntent: "UNDECIDED",
  currentSummary: "",
  dob: "",
  email: "",
  fullName: "",
  goalIds: [],
  preferredBatchId: "",
  preferredChannel: "",
  preferredDays: [],
  preferredEndTime: "",
  preferredStartTime: "",
  primaryPhone: "",
  programIds: [],
  source: "WHATSAPP_INQUIRY",
  sourceDetails: "",
};

export const emptyFilters: FilterState = {
  assignedUserId: "",
  createdFrom: "",
  createdTo: "",
  followUpFrom: "",
  followUpTo: "",
  programId: "",
  source: "",
  stage: "",
  status: "",
};

export const emptyVisitForm: VisitFormState = {
  discussion: "",
  programIds: [],
  currentIntent: "",
  preferredDays: [],
  preferredStartTime: "",
  preferredEndTime: "",
  nextActionNote: "",
};

export const emptyFollowUpForm: FollowUpFormState = {
  scheduledDate: "",
  scheduledTime: "",
  channel: "PHONE_CALL",
  reasonDetails: "",
  assignedUserId: "",
};

export const emptyCompleteFollowUpForm: CompleteFollowUpFormState = {
  channel: "PHONE_CALL",
  outcome: "INTERESTED",
  notes: "",
  includeNextFollowUp: false,
  nextFollowUp: emptyFollowUpForm,
};

export const emptyRescheduleFollowUpForm: RescheduleFollowUpFormState = {
  scheduledDate: "",
  scheduledTime: "",
  reason: "",
};

export const emptyCancelFollowUpForm: CancelFollowUpFormState = {
  reason: "",
};

export const emptyContactForm: ContactFormState = {
  channel: "PHONE_CALL",
  outcome: "INTERESTED",
  notes: "",
  includeNextFollowUp: false,
  nextFollowUp: emptyFollowUpForm,
};

export const leadSources: Array<{ label: string; value: LeadSource }> = [
  { label: "WhatsApp inquiry", value: "WHATSAPP_INQUIRY" },
  { label: "Walk-in", value: "WALK_IN" },
  { label: "Referral", value: "REFERRAL" },
  { label: "Instagram ads", value: "INSTAGRAM_ADS" },
  { label: "Facebook ads", value: "FACEBOOK_ADS" },
  { label: "Google ads", value: "GOOGLE_ADS" },
  { label: "Website", value: "WEBSITE" },
  { label: "Other", value: "OTHER" },
];

export const leadStages: Array<{ label: string; value: LeadStage }> = [
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Visit scheduled", value: "VISIT_SCHEDULED" },
  { label: "Visited", value: "VISITED" },
  { label: "Trial requested", value: "TRIAL_REQUESTED" },
  { label: "Trial scheduled", value: "TRIAL_SCHEDULED" },
  { label: "Trial completed", value: "TRIAL_COMPLETED" },
  { label: "Ready to join", value: "READY_TO_JOIN" },
  { label: "Converted", value: "CONVERTED" },
  { label: "Lost", value: "LOST" },
];

export const leadStatuses: Array<{ label: string; value: LeadStatus }> = [
  { label: "Active", value: "ACTIVE" },
  { label: "Follow-up", value: "FOLLOW_UP" },
  { label: "Unreachable", value: "UNREACHABLE" },
  { label: "Dormant", value: "DORMANT" },
  { label: "Archived", value: "ARCHIVED" },
];

export const leadIntentOptions: Array<{ label: string; value: LeadCurrentIntent }> = [
  { label: "Undecided", value: "UNDECIDED" },
  { label: "Needs time", value: "NEEDS_TIME" },
  { label: "Trial", value: "TRIAL" },
  { label: "Direct joining", value: "DIRECT_JOINING" },
];

export const timelineEventOptions: TimelineEventOption[] = [
  { label: "Lead created", value: "LEAD_CREATED" },
  { label: "Profile updated", value: "LEAD_PROFILE_UPDATED" },
  { label: "Assignment changed", value: "LEAD_ASSIGNMENT_CHANGED" },
  { label: "Visit recorded", value: "LEAD_VISIT_RECORDED" },
  { label: "Follow-up scheduled", value: "FOLLOW_UP_SCHEDULED" },
  { label: "Follow-up completed", value: "FOLLOW_UP_COMPLETED" },
  { label: "Follow-up rescheduled", value: "FOLLOW_UP_RESCHEDULED" },
  { label: "Follow-up cancelled", value: "FOLLOW_UP_CANCELLED" },
  { label: "Contact recorded", value: "LEAD_CONTACT_RECORDED" },
  { label: "Note added", value: "LEAD_NOTE_ADDED" },
  { label: "Marked lost", value: "LEAD_MARKED_LOST" },
  { label: "Re-engaged", value: "LEAD_REENGAGED" },
  { label: "Archived", value: "LEAD_ARCHIVED" },
  { label: "Reactivated", value: "LEAD_REACTIVATED" },
];

export const followUpStatusOptions: Array<{ label: string; value: LeadFollowUpStatus }> = [
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Rescheduled", value: "RESCHEDULED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const contactOutcomeOptions: Array<{ label: string; value: LeadContactOutcome }> = [
  { label: "Interested", value: "INTERESTED" },
  { label: "Needs time", value: "NEEDS_TIME" },
  { label: "Callback requested", value: "CALLBACK_REQUESTED" },
  { label: "No answer", value: "NO_ANSWER" },
  { label: "Unreachable", value: "UNREACHABLE" },
  { label: "Visit planned", value: "VISIT_PLANNED" },
  { label: "Trial requested", value: "TRIAL_REQUESTED" },
  { label: "Ready to join", value: "READY_TO_JOIN" },
  { label: "Not interested", value: "NOT_INTERESTED" },
];

export const preferredChannels: Array<{ label: string; value: LeadCommunicationChannel }> = [
  { label: "Phone call", value: "PHONE_CALL" },
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "SMS", value: "SMS" },
  { label: "Email", value: "EMAIL" },
  { label: "In person", value: "IN_PERSON" },
];

export const batchTypeOptions: Array<{ label: string; value: BatchTypePref }> = [
  { label: "Group batch", value: "GROUP_BATCH" },
  { label: "Group PT", value: "GROUP_PT" },
  { label: "Personal training", value: "PERSONAL_TRAINING" },
];

export const dayOptions = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

export const pageSize = 20;
