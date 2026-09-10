import type React from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Batch } from "@/lib/api/batches";
import type { Goal } from "@/lib/api/goals";
import type {
  BatchTypePref,
  LeadAssigneeOption,
  LeadCommunicationChannel,
  LeadCurrentIntent,
  LeadPhoneConflictError,
  LeadSource,
} from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import {
  batchTypeOptions,
  leadIntentOptions,
  leadSources,
  preferredChannels,
} from "../constants";
import type { LeadFormState } from "../types";
import { formatEnum, timeRange } from "../utils/lead-formatters";
import { DayPicker, MultiSelect, SelectField } from "./form-controls";
import { Alert, ConflictPanel } from "./shared";

export function LeadCreateDialog({
  activeGoals,
  activePrograms,
  assignees,
  branchBatches,
  canRequestLeads,
  form,
  formError,
  isOpen,
  isSaving,
  onClose,
  onErrorDismiss,
  onFormChange,
  onLocateConflict,
  onSubmit,
  phoneConflict,
}: {
  activeGoals: Goal[];
  activePrograms: Program[];
  assignees: LeadAssigneeOption[];
  branchBatches: Batch[];
  canRequestLeads: boolean;
  form: LeadFormState;
  formError: string;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onErrorDismiss: () => void;
  onFormChange: React.Dispatch<React.SetStateAction<LeadFormState>>;
  onLocateConflict: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  phoneConflict: LeadPhoneConflictError | null;
}) {
  return (
    <Dialog
      className="max-w-5xl"
      isOpen={isOpen}
      onClose={onClose}
      title="New Lead"
    >
      <form className="space-y-[var(--space-5)]" onSubmit={onSubmit}>
        {formError ? (
          <Alert tone="danger" onDismiss={onErrorDismiss}>
            {formError}
          </Alert>
        ) : null}
        {phoneConflict ? (
          <ConflictPanel conflict={phoneConflict} onLocate={onLocateConflict} />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            data-dialog-initial-focus
            label="Full name"
            onChange={(event) => onFormChange((current) => ({ ...current, fullName: event.target.value }))}
            required
            value={form.fullName}
          />
          <Input
            hint="10 digit Indian mobile numbers are saved as +91 format."
            label="Primary phone"
            onChange={(event) => onFormChange((current) => ({ ...current, primaryPhone: event.target.value }))}
            required
            value={form.primaryPhone}
          />
          <Input
            label="Alternate phone"
            onChange={(event) => onFormChange((current) => ({ ...current, alternatePhone: event.target.value }))}
            value={form.alternatePhone}
          />
          <Input
            label="Email"
            onChange={(event) => onFormChange((current) => ({ ...current, email: event.target.value }))}
            type="email"
            value={form.email}
          />
          <Input
            label="Date of birth"
            onChange={(event) => onFormChange((current) => ({ ...current, dob: event.target.value }))}
            type="date"
            value={form.dob}
          />
          <SelectField
            label="Source"
            onChange={(value) => onFormChange((current) => ({ ...current, source: value as LeadSource }))}
            options={leadSources}
            required
            value={form.source}
          />
          <SelectField
            label="Preferred channel"
            onChange={(value) =>
              onFormChange((current) => ({
                ...current,
                preferredChannel: value as LeadCommunicationChannel | "",
              }))
            }
            options={[{ label: "No preference", value: "" }, ...preferredChannels]}
            value={form.preferredChannel}
          />
          <SelectField
            label="Intent"
            onChange={(value) => onFormChange((current) => ({ ...current, currentIntent: value as LeadCurrentIntent }))}
            options={leadIntentOptions}
            value={form.currentIntent}
          />
          <SelectField
            label="Batch type preference"
            onChange={(value) =>
              onFormChange((current) => ({
                ...current,
                batchTypePref: value as BatchTypePref | "",
              }))
            }
            options={[{ label: "No preference", value: "" }, ...batchTypeOptions]}
            value={form.batchTypePref}
          />
          <SelectField
            label="Preferred batch"
            onChange={(value) => onFormChange((current) => ({ ...current, preferredBatchId: value }))}
            options={[
              { label: "No preferred batch", value: "" },
              ...branchBatches.map((batch) => ({
                label: `${batch.name} (${timeRange(batch)})`,
                value: batch.id,
              })),
            ]}
            value={form.preferredBatchId}
          />
          <SelectField
            label="Assign to"
            onChange={(value) => onFormChange((current) => ({ ...current, assignedUserId: value }))}
            options={[
              { label: "Unassigned", value: "" },
              ...assignees.map((assignee) => ({
                label: `${assignee.name} (${formatEnum(assignee.role)})`,
                value: assignee.userId,
              })),
            ]}
            value={form.assignedUserId}
          />
          <Input
            label="Source details"
            onChange={(event) => onFormChange((current) => ({ ...current, sourceDetails: event.target.value }))}
            value={form.sourceDetails}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MultiSelect
            label="Programs"
            onChange={(programIds) => onFormChange((current) => ({ ...current, programIds }))}
            options={activePrograms.map((program) => ({
              label: program.name,
              value: program.id,
            }))}
            values={form.programIds}
          />
          <MultiSelect
            label="Goals"
            onChange={(goalIds) => onFormChange((current) => ({ ...current, goalIds }))}
            options={activeGoals.map((goal) => ({
              label: goal.name,
              value: goal.id,
            }))}
            values={form.goalIds}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_12rem_12rem]">
          <DayPicker
            onChange={(preferredDays) => onFormChange((current) => ({ ...current, preferredDays }))}
            values={form.preferredDays}
          />
          <Input
            label="Start time"
            onChange={(event) => onFormChange((current) => ({ ...current, preferredStartTime: event.target.value }))}
            type="time"
            value={form.preferredStartTime}
          />
          <Input
            label="End time"
            onChange={(event) => onFormChange((current) => ({ ...current, preferredEndTime: event.target.value }))}
            type="time"
            value={form.preferredEndTime}
          />
        </div>

        <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
          <span>Current summary</span>
          <textarea
            className="min-h-24 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
            onChange={(event) => onFormChange((current) => ({ ...current, currentSummary: event.target.value }))}
            value={form.currentSummary}
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-[var(--color-divider)] pt-[var(--space-4)]">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button className="gap-2" disabled={isSaving || !canRequestLeads} type="submit">
            {isSaving ? (
              <Loader2 className="size-[var(--icon-sm)] animate-spin" />
            ) : (
              <UserPlus className="size-[var(--icon-sm)]" />
            )}
            Create Lead
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
