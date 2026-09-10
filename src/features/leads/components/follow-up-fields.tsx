import type React from "react";
import { Input } from "@/components/ui/input";
import type {
  LeadAssigneeOption,
  LeadCommunicationChannel,
} from "@/lib/api/leads";
import { preferredChannels } from "../constants";
import type { FollowUpFormState } from "../types";
import { formatEnum } from "../utils/lead-formatters";
import { SelectField } from "./form-controls";

export function FollowUpFields({
  assignees,
  form,
  onChange,
  withInitialFocus = false,
}: {
  assignees: LeadAssigneeOption[];
  form: FollowUpFormState;
  onChange: React.Dispatch<React.SetStateAction<FollowUpFormState>>;
  withInitialFocus?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          data-dialog-initial-focus={withInitialFocus ? true : undefined}
          label="Scheduled date"
          onChange={(event) => onChange((current) => ({ ...current, scheduledDate: event.target.value }))}
          required
          type="date"
          value={form.scheduledDate}
        />
        <Input
          label="Scheduled time"
          onChange={(event) => onChange((current) => ({ ...current, scheduledTime: event.target.value }))}
          required
          type="time"
          value={form.scheduledTime}
        />
        <SelectField
          label="Channel"
          onChange={(value) => onChange((current) => ({ ...current, channel: value as LeadCommunicationChannel }))}
          options={preferredChannels}
          required
          value={form.channel}
        />
        <SelectField
          label="Assign to"
          onChange={(value) => onChange((current) => ({ ...current, assignedUserId: value }))}
          options={[
            { label: "Unassigned", value: "" },
            ...assignees.map((assignee) => ({
              label: `${assignee.name} (${formatEnum(assignee.role)})`,
              value: assignee.userId,
            })),
          ]}
          value={form.assignedUserId}
        />
      </div>
      <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
        <span>Reason details</span>
        <textarea
          className="min-h-28 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
          maxLength={1000}
          onChange={(event) => onChange((current) => ({ ...current, reasonDetails: event.target.value }))}
          required
          value={form.reasonDetails}
        />
        <span className="text-xs font-normal text-[var(--color-text-muted)]">{form.reasonDetails.length}/1000</span>
      </label>
    </div>
  );
}

export function NextFollowUpFields({
  assignees,
  checked,
  disabled,
  followUp,
  onCheckedChange,
  onFollowUpChange,
  required,
}: {
  assignees: LeadAssigneeOption[];
  checked: boolean;
  disabled: boolean;
  followUp: FollowUpFormState;
  onCheckedChange: (checked: boolean) => void;
  onFollowUpChange: React.Dispatch<React.SetStateAction<FollowUpFormState>>;
  required: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
        <input
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
          type="checkbox"
        />
        Add next Follow-up{required ? " (required)" : ""}
      </label>
      {checked ? (
        <div className="mt-4">
          <FollowUpFields
            assignees={assignees}
            form={followUp}
            onChange={onFollowUpChange}
          />
        </div>
      ) : null}
    </div>
  );
}
