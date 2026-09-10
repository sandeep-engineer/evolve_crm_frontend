import type React from "react";
import { Ban, CalendarPlus, CheckCircle, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  LeadAssigneeOption,
  LeadCommunicationChannel,
  LeadContactOutcome,
  LeadFollowUpSummary,
} from "@/lib/api/leads";
import { contactOutcomeOptions, preferredChannels } from "../constants";
import type {
  CancelFollowUpFormState,
  CompleteFollowUpFormState,
  FollowUpAction,
  FollowUpFormState,
  RescheduleFollowUpFormState,
} from "../types";
import { followUpActionTitle, formatDateTime, formatEnum } from "../utils/lead-formatters";
import { SelectField } from "./form-controls";
import { FollowUpFields, NextFollowUpFields } from "./follow-up-fields";
import { Alert, EmptyPanel } from "./shared";

export function ScheduleFollowUpForm({
  assignees,
  form,
  formError,
  isSaving,
  onCancel,
  onChange,
  onErrorDismiss,
  onSubmit,
}: {
  assignees: LeadAssigneeOption[];
  form: FollowUpFormState;
  formError: string;
  isSaving: boolean;
  onCancel: () => void;
  onChange: React.Dispatch<React.SetStateAction<FollowUpFormState>>;
  onErrorDismiss: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="space-y-[var(--space-5)]" onSubmit={onSubmit}>
      {formError ? (
        <Alert tone="danger" onDismiss={onErrorDismiss}>
          {formError}
        </Alert>
      ) : null}
      <FollowUpFields
        assignees={assignees}
        form={form}
        onChange={onChange}
        withInitialFocus
      />
      <div className="flex justify-end gap-3 border-t border-[var(--color-divider)] pt-[var(--space-4)]">
        <Button disabled={isSaving} onClick={onCancel} type="button" variant="secondary">
          Cancel
        </Button>
        <Button className="gap-2" disabled={isSaving} type="submit">
          {isSaving ? <Loader2 className="size-[var(--icon-sm)] animate-spin" /> : <CalendarPlus className="size-[var(--icon-sm)]" />}
          Schedule Follow-up
        </Button>
      </div>
    </form>
  );
}

export function FollowUpActionForm({
  action,
  assignees,
  cancelForm,
  completeForm,
  error,
  followUp,
  isSaving,
  onCancel,
  onCancelFormChange,
  onCompleteFormChange,
  onErrorDismiss,
  onRescheduleFormChange,
  onSubmit,
  rescheduleForm,
}: {
  action: FollowUpAction | null;
  assignees: LeadAssigneeOption[];
  cancelForm: CancelFollowUpFormState;
  completeForm: CompleteFollowUpFormState;
  error: string;
  followUp: LeadFollowUpSummary | null;
  isSaving: boolean;
  onCancel: () => void;
  onCancelFormChange: React.Dispatch<React.SetStateAction<CancelFollowUpFormState>>;
  onCompleteFormChange: React.Dispatch<React.SetStateAction<CompleteFollowUpFormState>>;
  onErrorDismiss: () => void;
  onRescheduleFormChange: React.Dispatch<React.SetStateAction<RescheduleFollowUpFormState>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  rescheduleForm: RescheduleFollowUpFormState;
}) {
  if (!action || !followUp) return <EmptyPanel message="No Follow-up selected." />;

  return (
    <form className="space-y-[var(--space-5)]" onSubmit={onSubmit}>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
        {formatDateTime(followUp.scheduledAt)} | {formatEnum(followUp.channel)} | {followUp.reasonDetails}
      </div>
      {error ? (
        <Alert tone="danger" onDismiss={onErrorDismiss}>
          {error}
        </Alert>
      ) : null}

      {action === "complete" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Contact channel"
              onChange={(value) =>
                onCompleteFormChange((current) => ({
                  ...current,
                  channel: value as LeadCommunicationChannel,
                }))
              }
              options={preferredChannels}
              required
              value={completeForm.channel}
            />
            <SelectField
              label="Outcome"
              onChange={(value) =>
                onCompleteFormChange((current) => ({
                  ...current,
                  includeNextFollowUp: value === "CALLBACK_REQUESTED" ? true : current.includeNextFollowUp,
                  outcome: value as LeadContactOutcome,
                }))
              }
              options={contactOutcomeOptions}
              required
              value={completeForm.outcome}
            />
          </div>
          <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
            <span>Contact notes</span>
            <textarea
              className="min-h-32 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
              data-dialog-initial-focus
              maxLength={2000}
              onChange={(event) => onCompleteFormChange((current) => ({ ...current, notes: event.target.value }))}
              required
              value={completeForm.notes}
            />
            <span className="text-xs font-normal text-[var(--color-text-muted)]">{completeForm.notes.length}/2000</span>
          </label>
          <NextFollowUpFields
            assignees={assignees}
            checked={completeForm.includeNextFollowUp}
            disabled={completeForm.outcome === "CALLBACK_REQUESTED"}
            followUp={completeForm.nextFollowUp}
            onCheckedChange={(checked) =>
              onCompleteFormChange((current) => ({
                ...current,
                includeNextFollowUp: checked,
              }))
            }
            onFollowUpChange={(updater) =>
              onCompleteFormChange((current) => ({
                ...current,
                nextFollowUp:
                  typeof updater === "function"
                    ? updater(current.nextFollowUp)
                    : updater,
              }))
            }
            required={completeForm.outcome === "CALLBACK_REQUESTED"}
          />
        </>
      ) : null}

      {action === "reschedule" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            data-dialog-initial-focus
            label="New scheduled date"
            onChange={(event) => onRescheduleFormChange((current) => ({ ...current, scheduledDate: event.target.value }))}
            required
            type="date"
            value={rescheduleForm.scheduledDate}
          />
          <Input
            label="New scheduled time"
            onChange={(event) => onRescheduleFormChange((current) => ({ ...current, scheduledTime: event.target.value }))}
            required
            type="time"
            value={rescheduleForm.scheduledTime}
          />
          <label className="grid gap-2 text-sm font-medium text-[var(--color-text)] md:col-span-2">
            <span>Reschedule reason</span>
            <textarea
              className="min-h-28 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
              maxLength={1000}
              onChange={(event) => onRescheduleFormChange((current) => ({ ...current, reason: event.target.value }))}
              required
              value={rescheduleForm.reason}
            />
            <span className="text-xs font-normal text-[var(--color-text-muted)]">{rescheduleForm.reason.length}/1000</span>
          </label>
        </div>
      ) : null}

      {action === "cancel" ? (
        <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
          <span>Cancellation reason</span>
          <textarea
            className="min-h-28 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
            data-dialog-initial-focus
            maxLength={1000}
            onChange={(event) => onCancelFormChange({ reason: event.target.value })}
            required
            value={cancelForm.reason}
          />
          <span className="text-xs font-normal text-[var(--color-text-muted)]">{cancelForm.reason.length}/1000</span>
        </label>
      ) : null}

      <div className="flex justify-end gap-3 border-t border-[var(--color-divider)] pt-[var(--space-4)]">
        <Button disabled={isSaving} onClick={onCancel} type="button" variant="secondary">
          Cancel
        </Button>
        <Button className="gap-2" disabled={isSaving} type="submit">
          {isSaving ? <Loader2 className="size-[var(--icon-sm)] animate-spin" /> : followUpActionIcon(action)}
          {followUpActionTitle(action)}
        </Button>
      </div>
    </form>
  );
}

function followUpActionIcon(action: FollowUpAction) {
  if (action === "complete") return <CheckCircle className="size-[var(--icon-sm)]" />;
  if (action === "reschedule") return <RotateCw className="size-[var(--icon-sm)]" />;
  return <Ban className="size-[var(--icon-sm)]" />;
}
