import { Clock, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  LeadTimelineEvent,
  LeadTimelineEventType,
  PaginationMeta,
} from "@/lib/api/leads";
import { timelineEventOptions } from "../constants";
import { formatDateTime, formatEnum, labelFor } from "../utils/lead-formatters";
import { timelineDetails } from "../utils/lead-timeline-details";
import { SelectField } from "./form-controls";
import { EmptyPanel, LoadingPanel, Pagination } from "./shared";

export function LeadTimelinePanel({
  error,
  eventType,
  events,
  isLoading,
  meta,
  onEventTypeChange,
  onPageChange,
  onRetry,
}: {
  error: string;
  eventType: LeadTimelineEventType | "";
  events: LeadTimelineEvent[];
  isLoading: boolean;
  meta: PaginationMeta;
  onEventTypeChange: (eventType: LeadTimelineEventType | "") => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-[var(--space-4)]" role="tabpanel">
      <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 md:flex-row md:items-end md:justify-between">
        <SelectField
          label="Event type"
          onChange={(value) => onEventTypeChange(value as LeadTimelineEventType | "")}
          options={[{ label: "All event types", value: "" }, ...timelineEventOptions]}
          value={eventType}
        />
        <Button className="gap-2" disabled={isLoading} onClick={onRetry} variant="secondary">
          {isLoading ? <Loader2 className="size-[var(--icon-sm)] animate-spin" /> : <RefreshCw className="size-[var(--icon-sm)]" />}
          Refresh
        </Button>
      </div>
      {error ? (
        <EmptyPanel actionLabel="Retry" message={error} onAction={onRetry} tone="danger" />
      ) : isLoading ? (
        <LoadingPanel label="Loading Lead timeline" />
      ) : events.length ? (
        <div className="space-y-3">
          {events.map((event) => (
            <TimelineEventItem event={event} key={event.id} />
          ))}
        </div>
      ) : (
        <EmptyPanel message="No timeline events found for this Lead." />
      )}
      <Pagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}

function TimelineEventItem({ event }: { event: LeadTimelineEvent }) {
  const details = timelineDetails(event);
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">{labelFor(timelineEventOptions, event.eventType)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{event.summary}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
          <Clock className="size-[var(--icon-sm)]" />
          {formatDateTime(event.occurredAt)}
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-[var(--color-text-secondary)]">
        Performed by {event.actorUser ? `${event.actorUser.name} (${formatEnum(event.actorUser.role)})` : "Unknown user"}
      </p>
      {details.length ? (
        <dl className="mt-3 grid gap-2 md:grid-cols-2">
          {details.map((detail) => (
            <div className="grid gap-1" key={`${event.id}-${detail.label}`}>
              <dt className="text-xs font-bold uppercase text-[var(--color-text-muted)]">{detail.label}</dt>
              <dd className="break-words text-sm text-[var(--color-text)]">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}
