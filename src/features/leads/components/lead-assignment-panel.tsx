import { ChevronLeft, ChevronRight, Loader2, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LeadAssigneeOption, LeadDetail, PaginationMeta } from "@/lib/api/leads";
import { formatEnum } from "../utils/lead-formatters";

export function LeadAssignmentPanel({
  assigneeError,
  assigneeMeta,
  assigneePage,
  assigneeSearch,
  assignmentError,
  assignmentOptions,
  assignmentValue,
  currentAssignee,
  isAssigneesLoading,
  isSavingAssignment,
  onAssigneePageChange,
  onAssigneeSearchChange,
  onAssignmentChange,
  onSubmitAssignment,
}: {
  assigneeError: string;
  assigneeMeta: PaginationMeta;
  assigneePage: number;
  assigneeSearch: string;
  assignmentError: string;
  assignmentOptions: LeadAssigneeOption[];
  assignmentValue: string;
  currentAssignee: LeadDetail["assignedUser"];
  isAssigneesLoading: boolean;
  isSavingAssignment: boolean;
  onAssigneePageChange: (page: number) => void;
  onAssigneeSearchChange: (value: string) => void;
  onAssignmentChange: (value: string) => void;
  onSubmitAssignment: (assignedUserId: string | null) => void;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">Assignment</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {currentAssignee ? `${currentAssignee.name} (${formatEnum(currentAssignee.role)})` : "Unassigned"}
          </p>
        </div>
        <div className="grid w-full gap-3 lg:max-w-xl">
          <Input
            label="Search assignees"
            onChange={(event) => onAssigneeSearchChange(event.target.value)}
            placeholder="Search by name"
            value={assigneeSearch}
          />
          <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
            <span>Eligible assignee</span>
            <select
              className="h-[var(--control-height-lg)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm shadow-[var(--shadow-xs)] outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
              disabled={isAssigneesLoading || !assignmentOptions.length}
              onChange={(event) => onAssignmentChange(event.target.value)}
              value={assignmentValue}
            >
              <option value="">Unassigned</option>
              {assignmentOptions.map((assignee) => (
                <option key={assignee.userId} value={assignee.userId}>
                  {assignee.name} ({formatEnum(assignee.role)})
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[var(--color-text-secondary)]">
              {isAssigneesLoading ? "Loading assignees" : `${assigneeMeta.total} eligible options`}
            </span>
            <div className="flex gap-2">
              <Button
                aria-label="Previous assignee page"
                disabled={isAssigneesLoading || assigneePage <= 1}
                onClick={() => onAssigneePageChange(Math.max(1, assigneePage - 1))}
                variant="secondary"
              >
                <ChevronLeft className="size-[var(--icon-sm)]" />
              </Button>
              <Button
                aria-label="Next assignee page"
                disabled={isAssigneesLoading || assigneePage >= Math.max(1, assigneeMeta.totalPages)}
                onClick={() => onAssigneePageChange(Math.min(Math.max(1, assigneeMeta.totalPages), assigneePage + 1))}
                variant="secondary"
              >
                <ChevronRight className="size-[var(--icon-sm)]" />
              </Button>
            </div>
          </div>
          {assigneeError ? <p className="text-sm text-[var(--color-danger)]">{assigneeError}</p> : null}
          {assignmentError ? <p className="text-sm text-[var(--color-danger)]">{assignmentError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button
              className="gap-2"
              disabled={isSavingAssignment || !currentAssignee}
              onClick={() => void onSubmitAssignment(null)}
              variant="secondary"
            >
              {isSavingAssignment ? (
                <Loader2 className="size-[var(--icon-sm)] animate-spin" />
              ) : (
                <UserMinus className="size-[var(--icon-sm)]" />
              )}
              Unassign
            </Button>
            <Button
              className="gap-2"
              disabled={isSavingAssignment || !assignmentValue || assignmentValue === (currentAssignee?.id ?? "")}
              onClick={() => void onSubmitAssignment(assignmentValue)}
            >
              {isSavingAssignment ? (
                <Loader2 className="size-[var(--icon-sm)] animate-spin" />
              ) : (
                <UserPlus className="size-[var(--icon-sm)]" />
              )}
              Assign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
