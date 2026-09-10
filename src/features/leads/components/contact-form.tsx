import type React from "react";
import { Loader2, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/api/auth";
import type {
  LeadAssigneeOption,
  LeadCommunicationChannel,
  LeadContactOutcome,
} from "@/lib/api/leads";
import { contactOutcomeOptions, preferredChannels } from "../constants";
import type { ContactFormState } from "../types";
import { Alert } from "./shared";
import { SelectField } from "./form-controls";
import { NextFollowUpFields } from "./follow-up-fields";

export function RecordContactForm({
  assignees,
  currentUser,
  form,
  formError,
  isSaving,
  onCancel,
  onChange,
  onErrorDismiss,
  onSubmit,
}: {
  assignees: LeadAssigneeOption[];
  currentUser: AuthUser | null;
  form: ContactFormState;
  formError: string;
  isSaving: boolean;
  onCancel: () => void;
  onChange: React.Dispatch<React.SetStateAction<ContactFormState>>;
  onErrorDismiss: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="space-y-[var(--space-5)]" onSubmit={onSubmit}>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
        This Contact will be recorded under the currently signed-in User: {currentUser?.name ?? "current user"}.
      </div>
      {formError ? (
        <Alert tone="danger" onDismiss={onErrorDismiss}>
          {formError}
        </Alert>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Channel"
          onChange={(value) => onChange((current) => ({ ...current, channel: value as LeadCommunicationChannel }))}
          options={preferredChannels}
          required
          value={form.channel}
        />
        <SelectField
          label="Outcome"
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              includeNextFollowUp: value === "CALLBACK_REQUESTED" ? true : current.includeNextFollowUp,
              outcome: value as LeadContactOutcome,
            }))
          }
          options={contactOutcomeOptions}
          required
          value={form.outcome}
        />
      </div>
      <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
        <span>Notes</span>
        <textarea
          className="min-h-36 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
          data-dialog-initial-focus
          maxLength={2000}
          onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
          required
          value={form.notes}
        />
        <span className="text-xs font-normal text-[var(--color-text-muted)]">{form.notes.length}/2000</span>
      </label>
      <NextFollowUpFields
        assignees={assignees}
        checked={form.includeNextFollowUp}
        disabled={form.outcome === "CALLBACK_REQUESTED"}
        followUp={form.nextFollowUp}
        onCheckedChange={(checked) => onChange((current) => ({ ...current, includeNextFollowUp: checked }))}
        onFollowUpChange={(updater) =>
          onChange((current) => ({
            ...current,
            nextFollowUp:
              typeof updater === "function"
                ? updater(current.nextFollowUp)
                : updater,
          }))
        }
        required={form.outcome === "CALLBACK_REQUESTED"}
      />
      <div className="flex justify-end gap-3 border-t border-[var(--color-divider)] pt-[var(--space-4)]">
        <Button disabled={isSaving} onClick={onCancel} type="button" variant="secondary">
          Cancel
        </Button>
        <Button className="gap-2" disabled={isSaving} type="submit">
          {isSaving ? <Loader2 className="size-[var(--icon-sm)] animate-spin" /> : <PhoneCall className="size-[var(--icon-sm)]" />}
          Record Contact
        </Button>
      </div>
    </form>
  );
}
