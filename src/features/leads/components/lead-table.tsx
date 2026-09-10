import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialAvatar } from "@/components/ui/initial-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import type { LeadSummary } from "@/lib/api/leads";
import { avatarTone, formatDateTime, formatEnum, statusTone } from "../utils/lead-formatters";

export function LeadTable({
  isLoading,
  leads,
  metadataLoading,
  onOpenLead,
}: {
  isLoading: boolean;
  leads: LeadSummary[];
  metadataLoading: boolean;
  onOpenLead: (leadId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid min-h-80 place-items-center px-[var(--space-5)] py-[var(--space-8)]">
        <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-secondary)]">
          <Loader2 className="size-[var(--icon-md)] animate-spin text-[var(--color-primary)]" />
          Loading Leads
        </div>
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="grid min-h-80 place-items-center px-[var(--space-5)] py-[var(--space-8)] text-center">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">
            No Leads found
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Adjust the filters or create a Lead in the selected Branch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--color-divider)] text-left text-sm">
        <thead className="bg-[var(--color-surface-muted)] text-xs font-bold uppercase text-[var(--color-text-muted)]">
          <tr>
            {[
              "Lead",
              "Stage",
              "Status",
              "Source",
              "Intent",
              "Owner",
              "Next follow-up",
              "Created",
              "",
            ].map((heading) => (
              <th className="px-4 py-3" key={heading}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-divider)]">
          {leads.map((lead) => (
            <tr className="hover:bg-[var(--color-surface-hover)]" key={lead.id}>
              <td className="min-w-72 px-4 py-4">
                <div className="flex items-center gap-3">
                  <InitialAvatar name={lead.fullName} tone={avatarTone(lead.id)} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--color-text)]">
                      {lead.fullName}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-secondary)]">
                      {lead.primaryPhone || "No phone"}{lead.email ? ` | ${lead.email}` : ""}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {formatEnum(lead.stage)}
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={statusTone(lead.status)}>
                  {formatEnum(lead.status)}
                </StatusBadge>
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {formatEnum(lead.source)}
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {formatEnum(lead.currentIntent)}
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {metadataLoading ? "Loading" : lead.assignedUser?.name || "Unassigned"}
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {formatDateTime(lead.nextFollowUpAt)}
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {formatDateTime(lead.createdAt)}
              </td>
              <td className="px-4 py-4 text-right">
                <Button
                  aria-label={`Open ${lead.fullName} profile`}
                  className="gap-2"
                  onClick={() => onOpenLead(lead.id)}
                  variant="secondary"
                >
                  <Eye className="size-[var(--icon-sm)]" />
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
