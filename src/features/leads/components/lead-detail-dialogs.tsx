import type {
  LeadContactDetail,
  LeadFollowUpDetail,
  LeadVisitDetail,
} from "@/lib/api/leads";
import {
  formatDateTime,
  formatDays,
  formatEnum,
  formatPreferredTime,
  formatVisitPrograms,
  shortId,
} from "../utils/lead-formatters";
import { DetailItem, DetailSection, EmptyPanel, LoadingPanel } from "./shared";

export function VisitDetailDialog({
  error,
  isLoading,
  visit,
}: {
  error: string;
  isLoading: boolean;
  visit: LeadVisitDetail | null;
}) {
  if (isLoading) return <LoadingPanel label="Loading Visit detail" />;
  if (error) return <EmptyPanel message={error} tone="danger" />;
  if (!visit) return <EmptyPanel message="Visit detail is not available." />;
  return (
    <div className="space-y-4">
      <DetailSection title="Visit">
        <DetailItem label="Visit date" value={formatDateTime(visit.visitedAt)} />
        <DetailItem label="Recorded and handled by" value={visit.actorUser?.name ?? "Unknown user"} />
        <DetailItem label="Discussion" value={visit.discussion} />
      </DetailSection>
      <DetailSection title="Captured Preferences">
        <DetailItem label="Programs" value={formatVisitPrograms(visit.programs)} />
        <DetailItem label="Current intent" value={formatEnum(visit.currentIntent)} />
        <DetailItem label="Preferred days" value={formatDays(visit.preferredDays)} />
        <DetailItem label="Preferred time" value={formatPreferredTime(visit.preferredStartTime, visit.preferredEndTime)} />
        <DetailItem label="Next-action note" value={visit.nextActionNote} />
      </DetailSection>
    </div>
  );
}

export function FollowUpDetailDialog({
  error,
  followUp,
  isLoading,
}: {
  error: string;
  followUp: LeadFollowUpDetail | null;
  isLoading: boolean;
}) {
  if (isLoading) return <LoadingPanel label="Loading Follow-up detail" />;
  if (error) return <EmptyPanel message={error} tone="danger" />;
  if (!followUp) return <EmptyPanel message="Follow-up detail is not available." />;
  return (
    <div className="space-y-4">
      <DetailSection title="Schedule">
        <DetailItem label="Scheduled for" value={formatDateTime(followUp.scheduledAt)} />
        <DetailItem label="Channel" value={formatEnum(followUp.channel)} />
        <DetailItem label="Status" value={formatEnum(followUp.status)} />
        <DetailItem label="Overdue" value={followUp.isOverdue ? "Yes" : "No"} />
        <DetailItem label="Reason" value={followUp.reasonDetails} />
        <DetailItem label="Assigned to" value={followUp.assignedUser?.name ?? "Unassigned"} />
      </DetailSection>
      <DetailSection title="Outcome">
        <DetailItem label="Completed by" value={followUp.completedByUser?.name} />
        <DetailItem label="Completed at" value={formatDateTime(followUp.completedAt)} />
        <DetailItem label="Cancelled by" value={followUp.cancelledByUser?.name} />
        <DetailItem label="Cancelled at" value={formatDateTime(followUp.cancelledAt)} />
        <DetailItem label="Cancellation reason" value={followUp.cancellationReason} />
        <DetailItem label="Rescheduled by" value={followUp.rescheduledByUser?.name} />
        <DetailItem label="Rescheduled at" value={formatDateTime(followUp.rescheduledAt)} />
        <DetailItem label="Reschedule reason" value={followUp.rescheduleReason} />
        <DetailItem label="Replaces Follow-up" value={followUp.replacesFollowUpId ? shortId(followUp.replacesFollowUpId) : null} />
      </DetailSection>
      <DetailSection title="Audit">
        <DetailItem label="Created by" value={followUp.createdByUser?.name} />
        <DetailItem label="Updated by" value={followUp.updatedByUser?.name} />
        <DetailItem label="Created" value={formatDateTime(followUp.createdAt)} />
        <DetailItem label="Updated" value={formatDateTime(followUp.updatedAt)} />
      </DetailSection>
    </div>
  );
}

export function ContactDetailDialog({
  contact,
  error,
  isLoading,
}: {
  contact: LeadContactDetail | null;
  error: string;
  isLoading: boolean;
}) {
  if (isLoading) return <LoadingPanel label="Loading Contact detail" />;
  if (error) return <EmptyPanel message={error} tone="danger" />;
  if (!contact) return <EmptyPanel message="Contact detail is not available." />;
  return (
    <div className="space-y-4">
      <DetailSection title="Contact">
        <DetailItem label="Contacted at" value={formatDateTime(contact.contactedAt)} />
        <DetailItem label="Channel" value={formatEnum(contact.channel)} />
        <DetailItem label="Outcome" value={formatEnum(contact.outcome)} />
        <DetailItem label="Notes" value={contact.notes} />
      </DetailSection>
      <DetailSection title="Attribution">
        <DetailItem label="Handled by" value={contact.actorUser?.name ?? "Unknown user"} />
        <DetailItem
          label="Completed Follow-up"
          value={contact.completedFollowUpId ? shortId(contact.completedFollowUpId) : "Independent Contact"}
        />
        <DetailItem label="Created" value={formatDateTime(contact.createdAt)} />
      </DetailSection>
    </div>
  );
}
