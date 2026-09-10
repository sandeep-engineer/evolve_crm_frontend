import { Eye, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeadVisitSummary, PaginationMeta } from "@/lib/api/leads";
import { formatDateTime, formatEnum, formatPreferredTime, formatVisitPrograms } from "../utils/lead-formatters";
import { EmptyPanel, LoadingPanel, Pagination, VisitDetailItem } from "./shared";

export function LeadVisitsPanel({
  error,
  isLoading,
  meta,
  onOpenVisit,
  onPageChange,
  onRetry,
  visits,
}: {
  error: string;
  isLoading: boolean;
  meta: PaginationMeta;
  onOpenVisit: (visitId: string) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  visits: LeadVisitSummary[];
}) {
  return (
    <div className="space-y-[var(--space-4)]" role="tabpanel">
      <div className="flex justify-end">
        <Button className="gap-2" disabled={isLoading} onClick={onRetry} variant="secondary">
          {isLoading ? <Loader2 className="size-[var(--icon-sm)] animate-spin" /> : <RefreshCw className="size-[var(--icon-sm)]" />}
          Refresh
        </Button>
      </div>
      {error ? (
        <EmptyPanel actionLabel="Retry" message={error} onAction={onRetry} tone="danger" />
      ) : isLoading ? (
        <LoadingPanel label="Loading Lead visits" />
      ) : visits.length ? (
        <div className="space-y-3">
          {visits.map((visit) => (
            <VisitListItem key={visit.id} onOpen={() => onOpenVisit(visit.id)} visit={visit} />
          ))}
        </div>
      ) : (
        <EmptyPanel message="No Visits have been recorded for this Lead." />
      )}
      <Pagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}

function VisitListItem({ onOpen, visit }: { onOpen: () => void; visit: LeadVisitSummary }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-text)]">{formatDateTime(visit.visitedAt)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Recorded and handled by {visit.actorUser?.name ?? "Unknown user"}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text)]">{visit.discussion}</p>
        </div>
        <Button className="gap-2" onClick={onOpen} variant="secondary">
          <Eye className="size-[var(--icon-sm)]" />
          View detail
        </Button>
      </div>
      <dl className="mt-3 grid gap-2 md:grid-cols-3">
        <VisitDetailItem label="Programs" value={formatVisitPrograms(visit.programs)} />
        <VisitDetailItem label="Intent" value={formatEnum(visit.currentIntent)} />
        <VisitDetailItem label="Preferred time" value={formatPreferredTime(visit.preferredStartTime, visit.preferredEndTime)} />
      </dl>
    </article>
  );
}
