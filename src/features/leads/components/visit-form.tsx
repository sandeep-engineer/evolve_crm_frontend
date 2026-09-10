import type React from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/lib/api/auth";
import type { LeadCurrentIntent } from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import { leadIntentOptions } from "../constants";
import type { VisitFormState } from "../types";
import { Alert } from "./shared";
import { DayPicker, MultiSelect, SelectField } from "./form-controls";

export function RecordVisitForm({
  activePrograms,
  currentUser,
  form,
  formError,
  isSaving,
  onCancel,
  onChange,
  onErrorDismiss,
  onSubmit,
}: {
  activePrograms: Program[];
  currentUser: AuthUser | null;
  form: VisitFormState;
  formError: string;
  isSaving: boolean;
  onCancel: () => void;
  onChange: React.Dispatch<React.SetStateAction<VisitFormState>>;
  onErrorDismiss: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="space-y-[var(--space-5)]" onSubmit={onSubmit}>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
        This Visit will be recorded under the currently signed-in User: {currentUser?.name ?? "current user"}.
      </div>
      {formError ? (
        <Alert tone="danger" onDismiss={onErrorDismiss}>
          {formError}
        </Alert>
      ) : null}
      <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
        <span>Discussion</span>
        <textarea
          className="min-h-36 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
          data-dialog-initial-focus
          maxLength={2000}
          onChange={(event) => onChange((current) => ({ ...current, discussion: event.target.value }))}
          required
          value={form.discussion}
        />
        <span className="text-xs font-normal text-[var(--color-text-muted)]">{form.discussion.length}/2000</span>
      </label>
      <MultiSelect
        label="Programs"
        onChange={(programIds) => onChange((current) => ({ ...current, programIds }))}
        options={activePrograms.map((program) => ({ label: program.name, value: program.id }))}
        values={form.programIds}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Current intent"
          onChange={(value) => onChange((current) => ({ ...current, currentIntent: value as LeadCurrentIntent | "" }))}
          options={[{ label: "Not captured", value: "" }, ...leadIntentOptions]}
          value={form.currentIntent}
        />
        <Input
          label="Next-action note"
          maxLength={1000}
          onChange={(event) => onChange((current) => ({ ...current, nextActionNote: event.target.value }))}
          value={form.nextActionNote}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_12rem_12rem]">
        <DayPicker
          onChange={(preferredDays) => onChange((current) => ({ ...current, preferredDays }))}
          values={form.preferredDays}
        />
        <Input
          label="Start time"
          onChange={(event) => onChange((current) => ({ ...current, preferredStartTime: event.target.value }))}
          type="time"
          value={form.preferredStartTime}
        />
        <Input
          label="End time"
          onChange={(event) => onChange((current) => ({ ...current, preferredEndTime: event.target.value }))}
          type="time"
          value={form.preferredEndTime}
        />
      </div>
      <div className="flex justify-end gap-3 border-t border-[var(--color-divider)] pt-[var(--space-4)]">
        <Button disabled={isSaving} onClick={onCancel} type="button" variant="secondary">
          Cancel
        </Button>
        <Button className="gap-2" disabled={isSaving} type="submit">
          {isSaving ? <Loader2 className="size-[var(--icon-sm)] animate-spin" /> : <CalendarClock className="size-[var(--icon-sm)]" />}
          Record Visit
        </Button>
      </div>
    </form>
  );
}
