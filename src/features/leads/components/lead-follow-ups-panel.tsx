import { Ban, CheckCircle, Eye, Loader2, RefreshCw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  LeadAssigneeOption,
  LeadFollowUpStatus,
  LeadFollowUpSummary,
  PaginationMeta,
} from "@/lib/api/leads";
import { followUpStatusOptions } from "../constants";
import type { FollowUpAction } from "../types";
import { followUpStatusTone, formatDateTime, formatEnum } from "../utils/lead-formatters";
import { SelectField } from "./form-controls";
import { EmptyPanel, LoadingPanel, Pagination, VisitDetailItem } from "./shared";

export function LeadFollowUpsPanel({
  assignedFilter,
  assignees,
  error,
  followUps,
  isLoading,
  meta,
  onAction,
  onAssignedFilterChange,
  onOpenFollowUp,
  onOverdueOnlyChange,
  onPageChange,
  onRetry,
  onScheduledFromChange,
  onScheduledToChange,
  onStatusFilterChange,
  overdueOnly,
  scheduledFrom,
  scheduledTo,
  statusFilter,
}: {
  assignedFilter: string;
  assignees: LeadAssigneeOption[];
  error: string;
  followUps: LeadFollowUpSummary[];
  isLoading: boolean;
  meta: PaginationMeta;
  onAction: (action: FollowUpAction, followUp: LeadFollowUpSummary) => void;
  onAssignedFilterChange: (assignedUserId: string) => void;
  onOpenFollowUp: (followUpId: string) => void;
  onOverdueOnlyChange: (overdueOnly: boolean) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onScheduledFromChange: (value: string) => void;
  onScheduledToChange: (value: string) => void;
  onStatusFilterChange: (status: LeadFollowUpStatus | "") => void;
  overdueOnly: boolean;
  scheduledFrom: string;
  scheduledTo: string;
  statusFilter: LeadFollowUpStatus | "";
}) {
  return (
    <div className="space-y-[var(--space-4)]" role="tabpanel">
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <SelectField
            label="Status"
            onChange={(value) => onStatusFilterChange(value as LeadFollowUpStatus | "")}
            options={[{ label: "All statuses", value: "" }, ...followUpStatusOptions]}
            value={statusFilter}
          />
          <SelectField
            label="Assigned to"
            onChange={onAssignedFilterChange}
            options={[
              { label: "Anyone", value: "" },
              ...assignees.map((assignee) => ({
                label: `${assignee.name} (${formatEnum(assignee.role)})`,
                value: assignee.userId,
              })),
            ]}
            value={assignedFilter}
          />
          <Input
            label="Scheduled from"
            onChange={(event) => onScheduledFromChange(event.target.value)}
            type="date"
            value={scheduledFrom}
          />
          <Input
            label="Scheduled to"
            onChange={(event) => onScheduledToChange(event.target.value)}
            type="date"
            value={scheduledTo}
          />
          <div className="flex items-end gap-3">
            <label className="flex h-[var(--control-height-lg)] items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
              <input
                checked={overdueOnly}
                onChange={(event) => onOverdueOnlyChange(event.target.checked)}
                type="checkbox"
              />
              Overdue only
            </label>
            <Button aria-label="Refresh Follow-ups" disabled={isLoading} onClick={onRetry} variant="secondary">
              {isLoading ? <Loader2 className="size-[var(--icon-sm)] animate-spin" /> : <RefreshCw className="size-[var(--icon-sm)]" />}
            </Button>
          </div>
        </div>
      </div>
      {error ? (
        <EmptyPanel actionLabel="Retry" message={error} onAction={onRetry} tone="danger" />
      ) : isLoading ? (
        <LoadingPanel label="Loading Lead follow-ups" />
      ) : followUps.length ? (
        <div className="space-y-3">
          {followUps.map((followUp) => (
            <FollowUpListItem
              followUp={followUp}
              key={followUp.id}
              onAction={onAction}
              onOpen={() => onOpenFollowUp(followUp.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyPanel message="No Follow-ups found for this Lead." />
      )}
      <Pagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}

function FollowUpListItem({
  followUp,
  onAction,
  onOpen,
}: {
  followUp: LeadFollowUpSummary;
  onAction: (action: FollowUpAction, followUp: LeadFollowUpSummary) => void;
  onOpen: () => void;
}) {
  const isPending = followUp.status === "PENDING";
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-[var(--color-text)]">{formatDateTime(followUp.scheduledAt)}</p>
            <StatusBadge status={followUpStatusTone(followUp)}>{formatEnum(followUp.status)}</StatusBadge>
            {followUp.isOverdue ? <StatusBadge status="lost">Overdue</StatusBadge> : null}
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {formatEnum(followUp.channel)} | Assigned to {followUp.assignedUser?.name ?? "Unassigned"}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text)]">{followUp.reasonDetails}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" onClick={onOpen} variant="secondary">
            <Eye className="size-[var(--icon-sm)]" />
            View
          </Button>
          {isPending ? (
            <>
              <Button className="gap-2" onClick={() => onAction("complete", followUp)} variant="secondary">
                <CheckCircle className="size-[var(--icon-sm)]" />
                Complete
              </Button>
              <Button className="gap-2" onClick={() => onAction("reschedule", followUp)} variant="secondary">
                <RotateCw className="size-[var(--icon-sm)]" />
                Reschedule
              </Button>
              <Button className="gap-2" onClick={() => onAction("cancel", followUp)} variant="secondary">
                <Ban className="size-[var(--icon-sm)]" />
                Cancel
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <dl className="mt-3 grid gap-2 md:grid-cols-3">
        <VisitDetailItem label="Created by" value={followUp.createdByUser?.name ?? "Unknown user"} />
        <VisitDetailItem label="Completed" value={formatDateTime(followUp.completedAt)} />
        <VisitDetailItem label="Updated" value={formatDateTime(followUp.updatedAt)} />
      </dl>
    </article>
  );
}
