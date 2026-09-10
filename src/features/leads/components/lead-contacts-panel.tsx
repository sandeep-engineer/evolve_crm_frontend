import { Eye, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  LeadCommunicationChannel,
  LeadContactOutcome,
  LeadContactSummary,
  PaginationMeta,
} from "@/lib/api/leads";
import { contactOutcomeOptions, preferredChannels } from "../constants";
import { formatDateTime, formatEnum, shortId } from "../utils/lead-formatters";
import { SelectField } from "./form-controls";
import { EmptyPanel, LoadingPanel, Pagination, VisitDetailItem } from "./shared";

export function LeadContactsPanel({
  channelFilter,
  contacts,
  error,
  isLoading,
  meta,
  onChannelFilterChange,
  onOpenContact,
  onOutcomeFilterChange,
  onPageChange,
  onRetry,
  outcomeFilter,
}: {
  channelFilter: LeadCommunicationChannel | "";
  contacts: LeadContactSummary[];
  error: string;
  isLoading: boolean;
  meta: PaginationMeta;
  onChannelFilterChange: (channel: LeadCommunicationChannel | "") => void;
  onOpenContact: (contactId: string) => void;
  onOutcomeFilterChange: (outcome: LeadContactOutcome | "") => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  outcomeFilter: LeadContactOutcome | "";
}) {
  return (
    <div className="space-y-[var(--space-4)]" role="tabpanel">
      <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 md:flex-row md:items-end md:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-2">
          <SelectField
            label="Channel"
            onChange={(value) => onChannelFilterChange(value as LeadCommunicationChannel | "")}
            options={[{ label: "All channels", value: "" }, ...preferredChannels]}
            value={channelFilter}
          />
          <SelectField
            label="Outcome"
            onChange={(value) => onOutcomeFilterChange(value as LeadContactOutcome | "")}
            options={[{ label: "All outcomes", value: "" }, ...contactOutcomeOptions]}
            value={outcomeFilter}
          />
        </div>
        <Button className="gap-2" disabled={isLoading} onClick={onRetry} variant="secondary">
          {isLoading ? <Loader2 className="size-[var(--icon-sm)] animate-spin" /> : <RefreshCw className="size-[var(--icon-sm)]" />}
          Refresh
        </Button>
      </div>
      {error ? (
        <EmptyPanel actionLabel="Retry" message={error} onAction={onRetry} tone="danger" />
      ) : isLoading ? (
        <LoadingPanel label="Loading Lead contact history" />
      ) : contacts.length ? (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <ContactListItem
              contact={contact}
              key={contact.id}
              onOpen={() => onOpenContact(contact.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyPanel message="No Contact records found for this Lead." />
      )}
      <Pagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}

function ContactListItem({ contact, onOpen }: { contact: LeadContactSummary; onOpen: () => void }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-[var(--color-text)]">{formatDateTime(contact.contactedAt)}</p>
            <StatusBadge status="active">{formatEnum(contact.outcome)}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {formatEnum(contact.channel)} | Handled by {contact.actorUser?.name ?? "Unknown user"}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text)]">{contact.notes}</p>
        </div>
        <Button className="gap-2" onClick={onOpen} variant="secondary">
          <Eye className="size-[var(--icon-sm)]" />
          View
        </Button>
      </div>
      <dl className="mt-3 grid gap-2 md:grid-cols-3">
        <VisitDetailItem
          label="From Follow-up"
          value={contact.completedFollowUpId ? shortId(contact.completedFollowUpId) : "Independent Contact"}
        />
        <VisitDetailItem label="Created" value={formatDateTime(contact.createdAt)} />
        <VisitDetailItem label="Contact ID" value={shortId(contact.id)} />
      </dl>
    </article>
  );
}
