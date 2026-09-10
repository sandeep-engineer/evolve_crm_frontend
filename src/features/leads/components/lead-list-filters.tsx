import type React from "react";
import { Filter, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import type { Program } from "@/lib/api/programs";
import type { LeadAssigneeOption, LeadSource, LeadStage, LeadStatus } from "@/lib/api/leads";
import { leadSources, leadStages, leadStatuses } from "../constants";
import type { FilterState } from "../types";
import { formatEnum, labelFor } from "../utils/lead-formatters";

export function LeadListFilters({
  activePrograms,
  assignees,
  filters,
  onReset,
  search,
  setFilters,
  setSearch,
}: {
  activePrograms: Program[];
  assignees: LeadAssigneeOption[];
  filters: FilterState;
  onReset: () => void;
  search: string;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  setSearch: (value: string) => void;
}) {
  return (
    <Card className="p-[var(--card-padding)]">
      <div className="flex flex-col gap-[var(--space-4)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative flex min-w-0 flex-1 items-center">
            <Search className="pointer-events-none absolute left-4 size-[var(--icon-sm)] text-[var(--color-text-muted)]" />
            <input
              className="h-[var(--control-height-lg)] w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-11 pr-4 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, email, summary"
              type="search"
              value={search}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterSelect
              active={Boolean(filters.stage)}
              icon={Filter}
              label={filters.stage ? labelFor(leadStages, filters.stage) : "Stage"}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  stage: event.target.value as LeadStage | "",
                }))
              }
              options={[{ label: "All stages", value: "" }, ...leadStages]}
              value={filters.stage}
            />
            <FilterSelect
              active={Boolean(filters.status)}
              icon={Filter}
              label={filters.status ? labelFor(leadStatuses, filters.status) : "Status"}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as LeadStatus | "",
                }))
              }
              options={[{ label: "All statuses", value: "" }, ...leadStatuses]}
              value={filters.status}
            />
            <FilterSelect
              active={Boolean(filters.source)}
              icon={Filter}
              label={filters.source ? labelFor(leadSources, filters.source) : "Source"}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  source: event.target.value as LeadSource | "",
                }))
              }
              options={[{ label: "All sources", value: "" }, ...leadSources]}
              value={filters.source}
            />
            <FilterSelect
              active={Boolean(filters.programId)}
              icon={SlidersHorizontal}
              label={
                filters.programId
                  ? activePrograms.find((program) => program.id === filters.programId)?.name ?? "Program"
                  : "Program"
              }
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  programId: event.target.value,
                }))
              }
              options={[
                { label: "All programs", value: "" },
                ...activePrograms.map((program) => ({
                  label: program.name,
                  value: program.id,
                })),
              ]}
              value={filters.programId}
            />
            <Button className="gap-2" onClick={onReset} variant="secondary">
              <RefreshCw className="size-[var(--icon-sm)]" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Created from"
            onChange={(event) =>
              setFilters((current) => ({ ...current, createdFrom: event.target.value }))
            }
            type="date"
            value={filters.createdFrom}
          />
          <Input
            label="Created to"
            onChange={(event) =>
              setFilters((current) => ({ ...current, createdTo: event.target.value }))
            }
            type="date"
            value={filters.createdTo}
          />
          <Input
            label="Follow-up from"
            onChange={(event) =>
              setFilters((current) => ({ ...current, followUpFrom: event.target.value }))
            }
            type="date"
            value={filters.followUpFrom}
          />
          <Input
            label="Follow-up to"
            onChange={(event) =>
              setFilters((current) => ({ ...current, followUpTo: event.target.value }))
            }
            type="date"
            value={filters.followUpTo}
          />
          <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
            <span>Assigned to</span>
            <select
              className="h-[var(--control-height-lg)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm shadow-[var(--shadow-xs)] outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  assignedUserId: event.target.value,
                }))
              }
              value={filters.assignedUserId}
            >
              <option value="">Anyone</option>
              {assignees.map((assignee) => (
                <option key={assignee.userId} value={assignee.userId}>
                  {assignee.name} ({formatEnum(assignee.role)})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </Card>
  );
}
