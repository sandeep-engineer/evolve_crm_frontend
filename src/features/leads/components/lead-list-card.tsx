import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LeadSummary, PaginationMeta } from "@/lib/api/leads";
import { LeadTable } from "./lead-table";
import { Pagination } from "./shared";

export function LeadListCard({
  canRequestLeads,
  isListLoading,
  isMetadataLoading,
  leads,
  meta,
  onOpenLead,
  onPageChange,
  onRefresh,
}: {
  canRequestLeads: boolean;
  isListLoading: boolean;
  isMetadataLoading: boolean;
  leads: LeadSummary[];
  meta: PaginationMeta;
  onOpenLead: (leadId: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--color-divider)] px-[var(--space-5)] py-[var(--space-4)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">
            Scoped Lead list
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {canRequestLeads
              ? `${meta.total} total records from backend metadata`
              : "Select a valid scope to load Leads."}
          </p>
        </div>
        <Button
          className="gap-2"
          disabled={!canRequestLeads || isListLoading}
          onClick={onRefresh}
          variant="secondary"
        >
          {isListLoading ? (
            <Loader2 className="size-[var(--icon-sm)] animate-spin" />
          ) : (
            <RefreshCw className="size-[var(--icon-sm)]" />
          )}
          Refresh
        </Button>
      </div>

      <LeadTable
        isLoading={isListLoading}
        leads={leads}
        metadataLoading={isMetadataLoading}
        onOpenLead={onOpenLead}
      />

      <Pagination meta={meta} onPageChange={onPageChange} />
    </Card>
  );
}
