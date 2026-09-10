import type React from "react";
import {
  CalendarClock,
  CalendarPlus,
  History,
  Loader2,
  Pencil,
  PhoneCall,
  RefreshCw,
  Save,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialAvatar } from "@/components/ui/initial-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Batch } from "@/lib/api/batches";
import type { Goal } from "@/lib/api/goals";
import type {
  LeadAssigneeOption,
  LeadCommunicationChannel,
  LeadContactOutcome,
  LeadContactSummary,
  LeadDetail,
  LeadFollowUpStatus,
  LeadFollowUpSummary,
  LeadPhoneConflictError,
  LeadTimelineEvent,
  LeadTimelineEventType,
  LeadVisitSummary,
  PaginationMeta,
} from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import { cn } from "@/lib/utils";
import type { FollowUpAction, LeadFormState, LeadProfileTab } from "../types";
import { avatarTone, formatEnum, statusTone } from "../utils/lead-formatters";
import { LeadAssignmentPanel } from "./lead-assignment-panel";
import { LeadContactsPanel, LeadFollowUpsPanel, LeadTimelinePanel, LeadVisitsPanel } from "./lead-activity-panels";
import { LeadDetailView, LeadEditableFields } from "./lead-detail-view";
import { ConflictPanel } from "./shared";

export function LeadProfileDialog({
  activeGoals,
  activePrograms,
  assigneeError,
  assigneeMeta,
  assigneePage,
  assigneeSearch,
  assignees,
  assignmentError,
  assignmentValue,
  branchBatches,
  contactChannelFilter,
  contactOutcomeFilter,
  contacts,
  contactsError,
  contactsMeta,
  editConflict,
  followUpAssignedFilter,
  followUpOverdueOnly,
  followUpScheduledFrom,
  followUpScheduledTo,
  followUpStatusFilter,
  followUps,
  followUpsError,
  followUpsMeta,
  form,
  isAssigneesLoading,
  isContactsLoading,
  isEditing,
  isFollowUpsLoading,
  isLoading,
  isSavingAssignment,
  isSavingProfile,
  isTimelineLoading,
  isVisitsLoading,
  lead,
  onAssigneePageChange,
  onAssigneeSearchChange,
  onAssignmentChange,
  onCancelEdit,
  onContactChannelFilterChange,
  onContactOutcomeFilterChange,
  onContactPageChange,
  onContactsRetry,
  onEdit,
  onFieldChange,
  onFollowUpAction,
  onFollowUpAssignedFilterChange,
  onFollowUpOverdueOnlyChange,
  onFollowUpPageChange,
  onFollowUpScheduledFromChange,
  onFollowUpScheduledToChange,
  onFollowUpStatusFilterChange,
  onFollowUpsRetry,
  onLocateConflict,
  onOpenContact,
  onOpenFollowUp,
  onOpenRecordContact,
  onOpenRecordVisit,
  onOpenScheduleFollowUp,
  onOpenVisit,
  onRetry,
  onTabChange,
  onSubmitAssignment,
  onSubmitProfile,
  onTimelineEventTypeChange,
  onTimelinePageChange,
  onTimelineRetry,
  onVisitPageChange,
  onVisitsRetry,
  profileError,
  profileStatus,
  profileTab,
  timelineError,
  timelineEventType,
  timelineEvents,
  timelineMeta,
  visits,
  visitsError,
  visitsMeta,
}: {
  activeGoals: Goal[];
  activePrograms: Program[];
  assigneeError: string;
  assigneeMeta: PaginationMeta;
  assigneePage: number;
  assigneeSearch: string;
  assignees: LeadAssigneeOption[];
  assignmentError: string;
  assignmentValue: string;
  branchBatches: Batch[];
  contactChannelFilter: LeadCommunicationChannel | "";
  contactOutcomeFilter: LeadContactOutcome | "";
  contacts: LeadContactSummary[];
  contactsError: string;
  contactsMeta: PaginationMeta;
  editConflict: LeadPhoneConflictError | null;
  followUpAssignedFilter: string;
  followUpOverdueOnly: boolean;
  followUpScheduledFrom: string;
  followUpScheduledTo: string;
  followUpStatusFilter: LeadFollowUpStatus | "";
  followUps: LeadFollowUpSummary[];
  followUpsError: string;
  followUpsMeta: PaginationMeta;
  form: LeadFormState;
  isAssigneesLoading: boolean;
  isContactsLoading: boolean;
  isEditing: boolean;
  isFollowUpsLoading: boolean;
  isLoading: boolean;
  isSavingAssignment: boolean;
  isSavingProfile: boolean;
  isTimelineLoading: boolean;
  isVisitsLoading: boolean;
  lead: LeadDetail | null;
  onAssigneePageChange: (page: number) => void;
  onAssigneeSearchChange: (value: string) => void;
  onAssignmentChange: (value: string) => void;
  onCancelEdit: () => void;
  onContactChannelFilterChange: (channel: LeadCommunicationChannel | "") => void;
  onContactOutcomeFilterChange: (outcome: LeadContactOutcome | "") => void;
  onContactPageChange: (page: number) => void;
  onContactsRetry: () => void;
  onEdit: () => void;
  onFieldChange: React.Dispatch<React.SetStateAction<LeadFormState>>;
  onFollowUpAction: (action: FollowUpAction, followUp: LeadFollowUpSummary) => void;
  onFollowUpAssignedFilterChange: (assignedUserId: string) => void;
  onFollowUpOverdueOnlyChange: (overdueOnly: boolean) => void;
  onFollowUpPageChange: (page: number) => void;
  onFollowUpScheduledFromChange: (value: string) => void;
  onFollowUpScheduledToChange: (value: string) => void;
  onFollowUpStatusFilterChange: (status: LeadFollowUpStatus | "") => void;
  onFollowUpsRetry: () => void;
  onLocateConflict: (conflict: LeadPhoneConflictError) => void;
  onOpenContact: (contactId: string) => void;
  onOpenFollowUp: (followUpId: string) => void;
  onOpenRecordContact: () => void;
  onOpenRecordVisit: () => void;
  onOpenScheduleFollowUp: () => void;
  onOpenVisit: (visitId: string) => void;
  onRetry: () => void;
  onTabChange: (tab: LeadProfileTab) => void;
  onSubmitAssignment: (assignedUserId: string | null) => void;
  onSubmitProfile: (event: React.FormEvent<HTMLFormElement>) => void;
  onTimelineEventTypeChange: (eventType: LeadTimelineEventType | "") => void;
  onTimelinePageChange: (page: number) => void;
  onTimelineRetry: () => void;
  onVisitPageChange: (page: number) => void;
  onVisitsRetry: () => void;
  profileError: string;
  profileStatus: number | null;
  profileTab: LeadProfileTab;
  timelineError: string;
  timelineEventType: LeadTimelineEventType | "";
  timelineEvents: LeadTimelineEvent[];
  timelineMeta: PaginationMeta;
  visits: LeadVisitSummary[];
  visitsError: string;
  visitsMeta: PaginationMeta;
}) {
  if (isLoading) {
    return (
      <div className="grid min-h-96 place-items-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-secondary)]">
          <Loader2 className="size-[var(--icon-md)] animate-spin text-[var(--color-primary)]" />
          Loading Lead profile
        </div>
      </div>
    );
  }

  if (!lead) {
    const title =
      profileStatus === 403
        ? "Lead profile unavailable"
        : profileStatus === 404
          ? "Lead not found"
          : "Unable to load Lead profile";
    return (
      <div className="grid min-h-96 place-items-center text-center">
        <div className="max-w-md">
          <ShieldAlert className="mx-auto size-10 text-[var(--color-danger)]" />
          <p className="mt-3 text-base font-bold text-[var(--color-text)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {profileError || "The requested Lead could not be loaded."}
          </p>
          <Button className="mt-4 gap-2" onClick={onRetry} variant="secondary">
            <RefreshCw className="size-[var(--icon-sm)]" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const currentAssignee = lead.assignedUser;
  const assignmentOptions = currentAssignee && !assignees.some((assignee) => assignee.userId === currentAssignee.id)
    ? [
        {
          userId: currentAssignee.id,
          name: currentAssignee.name,
          role: currentAssignee.role === "BRANCH_ADMIN" ? "BRANCH_ADMIN" as const : "RECEPTIONIST" as const,
          organizationId: currentAssignee.organizationId ?? lead.organizationId ?? "",
          branchId: currentAssignee.branchId ?? lead.branchId,
        },
        ...assignees,
      ]
    : assignees;
  const canRecordActivity = lead.stage !== "CONVERTED" && lead.status !== "ARCHIVED";

  return (
    <div className="space-y-[var(--space-5)]">
      {profileError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--red-50)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {profileError}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <InitialAvatar name={lead.fullName} tone={avatarTone(lead.id)} />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-[var(--color-text)]">{lead.fullName}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {lead.primaryPhone || "No primary phone"} | {lead.email || "No email"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={statusTone(lead.status)}>{formatEnum(lead.status)}</StatusBadge>
          <StatusBadge status="pending">{formatEnum(lead.stage)}</StatusBadge>
          <Button
            className="gap-2"
            disabled={!canRecordActivity}
            onClick={onOpenScheduleFollowUp}
            title={canRecordActivity ? "Schedule Follow-up" : "Follow-ups cannot be scheduled for archived or converted Leads"}
            variant="secondary"
          >
            <CalendarPlus className="size-[var(--icon-sm)]" />
            Schedule Follow-up
          </Button>
          <Button
            className="gap-2"
            disabled={!canRecordActivity}
            onClick={onOpenRecordContact}
            title={canRecordActivity ? "Record Contact" : "Contacts cannot be recorded for archived or converted Leads"}
            variant="secondary"
          >
            <PhoneCall className="size-[var(--icon-sm)]" />
            Record Contact
          </Button>
          <Button
            className="gap-2"
            disabled={!canRecordActivity}
            onClick={onOpenRecordVisit}
            title={canRecordActivity ? "Record Visit" : "Visits cannot be recorded for archived or converted Leads"}
            variant="secondary"
          >
            <CalendarClock className="size-[var(--icon-sm)]" />
            Record Visit
          </Button>
          {!isEditing ? (
            <Button className="gap-2" onClick={onEdit} variant="secondary">
              <Pencil className="size-[var(--icon-sm)]" />
              Edit
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--color-divider)]" role="tablist" aria-label="Lead profile sections">
        <ProfileTabButton active={profileTab === "profile"} icon={UserCheck} label="Profile" onClick={() => onTabChange("profile")} />
        <ProfileTabButton active={profileTab === "timeline"} icon={History} label="Timeline" onClick={() => onTabChange("timeline")} />
        <ProfileTabButton active={profileTab === "visits"} icon={CalendarClock} label="Visits" onClick={() => onTabChange("visits")} />
        <ProfileTabButton active={profileTab === "followups"} icon={CalendarPlus} label="Follow-ups" onClick={() => onTabChange("followups")} />
        <ProfileTabButton active={profileTab === "contacts"} icon={PhoneCall} label="Contacts" onClick={() => onTabChange("contacts")} />
      </div>

      {profileTab === "profile" ? (
        <div className="space-y-[var(--space-5)]" role="tabpanel">
          {isEditing ? (
            <form className="space-y-[var(--space-5)]" onSubmit={onSubmitProfile}>
              {editConflict ? (
                <ConflictPanel conflict={editConflict} onLocate={() => onLocateConflict(editConflict)} />
              ) : null}
              <LeadEditableFields
                activeGoals={activeGoals}
                activePrograms={activePrograms}
                branchBatches={branchBatches}
                form={form}
                onFieldChange={onFieldChange}
              />
              <div className="flex justify-end gap-3 border-t border-[var(--color-divider)] pt-[var(--space-4)]">
                <Button disabled={isSavingProfile} onClick={onCancelEdit} type="button" variant="secondary">
                  Cancel
                </Button>
                <Button className="gap-2" disabled={isSavingProfile} type="submit">
                  {isSavingProfile ? (
                    <Loader2 className="size-[var(--icon-sm)] animate-spin" />
                  ) : (
                    <Save className="size-[var(--icon-sm)]" />
                  )}
                  Save profile
                </Button>
              </div>
            </form>
          ) : (
            <LeadDetailView activeGoals={activeGoals} activePrograms={activePrograms} branchBatches={branchBatches} lead={lead} />
          )}

          <LeadAssignmentPanel
            assigneeError={assigneeError}
            assigneeMeta={assigneeMeta}
            assigneePage={assigneePage}
            assigneeSearch={assigneeSearch}
            assignmentError={assignmentError}
            assignmentOptions={assignmentOptions}
            assignmentValue={assignmentValue}
            currentAssignee={currentAssignee}
            isAssigneesLoading={isAssigneesLoading}
            isSavingAssignment={isSavingAssignment}
            onAssigneePageChange={onAssigneePageChange}
            onAssigneeSearchChange={onAssigneeSearchChange}
            onAssignmentChange={onAssignmentChange}
            onSubmitAssignment={onSubmitAssignment}
          />
        </div>
      ) : null}

      {profileTab === "timeline" ? (
        <LeadTimelinePanel
          error={timelineError}
          eventType={timelineEventType}
          events={timelineEvents}
          isLoading={isTimelineLoading}
          meta={timelineMeta}
          onEventTypeChange={onTimelineEventTypeChange}
          onPageChange={onTimelinePageChange}
          onRetry={onTimelineRetry}
        />
      ) : null}

      {profileTab === "visits" ? (
        <LeadVisitsPanel
          error={visitsError}
          isLoading={isVisitsLoading}
          meta={visitsMeta}
          onOpenVisit={onOpenVisit}
          onPageChange={onVisitPageChange}
          onRetry={onVisitsRetry}
          visits={visits}
        />
      ) : null}

      {profileTab === "followups" ? (
        <LeadFollowUpsPanel
          assignedFilter={followUpAssignedFilter}
          assignees={assignmentOptions}
          error={followUpsError}
          followUps={followUps}
          isLoading={isFollowUpsLoading}
          meta={followUpsMeta}
          onAction={onFollowUpAction}
          onAssignedFilterChange={onFollowUpAssignedFilterChange}
          onOpenFollowUp={onOpenFollowUp}
          onOverdueOnlyChange={onFollowUpOverdueOnlyChange}
          onPageChange={onFollowUpPageChange}
          onRetry={onFollowUpsRetry}
          onScheduledFromChange={onFollowUpScheduledFromChange}
          onScheduledToChange={onFollowUpScheduledToChange}
          onStatusFilterChange={onFollowUpStatusFilterChange}
          overdueOnly={followUpOverdueOnly}
          scheduledFrom={followUpScheduledFrom}
          scheduledTo={followUpScheduledTo}
          statusFilter={followUpStatusFilter}
        />
      ) : null}

      {profileTab === "contacts" ? (
        <LeadContactsPanel
          channelFilter={contactChannelFilter}
          contacts={contacts}
          error={contactsError}
          isLoading={isContactsLoading}
          meta={contactsMeta}
          onChannelFilterChange={onContactChannelFilterChange}
          onOpenContact={onOpenContact}
          onOutcomeFilterChange={onContactOutcomeFilterChange}
          onPageChange={onContactPageChange}
          onRetry={onContactsRetry}
          outcomeFilter={contactOutcomeFilter}
        />
      ) : null}
    </div>
  );
}

function ProfileTabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-selected={active}
      className={cn(
        "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold",
        active
          ? "border-[var(--color-primary)] text-[var(--color-primary)]"
          : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
      )}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <Icon className="size-[var(--icon-sm)]" />
      {label}
    </button>
  );
}
