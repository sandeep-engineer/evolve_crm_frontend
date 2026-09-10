import type React from "react";
import { Input } from "@/components/ui/input";
import type { Batch } from "@/lib/api/batches";
import type { Goal } from "@/lib/api/goals";
import type {
  BatchTypePref,
  LeadCommunicationChannel,
  LeadCurrentIntent,
  LeadDetail,
  LeadSource,
} from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import { batchTypeOptions, leadIntentOptions, leadSources, preferredChannels } from "../constants";
import type { LeadFormState } from "../types";
import {
  batchNameFor,
  formatDateOnly,
  formatDateTime,
  formatDays,
  formatEnum,
  formatLeadGoals,
  formatLeadPrograms,
  formatPreferredTime,
  formatSafeUser,
  timeRange,
} from "../utils/lead-formatters";
import { DayPicker, MultiSelect, SelectField } from "./form-controls";
import { DetailItem, DetailSection } from "./shared";

export function LeadEditableFields({
  activeGoals,
  activePrograms,
  branchBatches,
  form,
  onFieldChange,
}: {
  activeGoals: Goal[];
  activePrograms: Program[];
  branchBatches: Batch[];
  form: LeadFormState;
  onFieldChange: React.Dispatch<React.SetStateAction<LeadFormState>>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Full name"
          onChange={(event) => onFieldChange((current) => ({ ...current, fullName: event.target.value }))}
          required
          value={form.fullName}
        />
        <Input
          hint="10 digit Indian mobile numbers are saved as +91 format."
          label="Primary phone"
          onChange={(event) => onFieldChange((current) => ({ ...current, primaryPhone: event.target.value }))}
          required
          value={form.primaryPhone}
        />
        <Input
          label="Alternate phone"
          onChange={(event) => onFieldChange((current) => ({ ...current, alternatePhone: event.target.value }))}
          value={form.alternatePhone}
        />
        <Input
          label="Email"
          onChange={(event) => onFieldChange((current) => ({ ...current, email: event.target.value }))}
          type="email"
          value={form.email}
        />
        <Input
          label="Date of birth"
          onChange={(event) => onFieldChange((current) => ({ ...current, dob: event.target.value }))}
          type="date"
          value={form.dob}
        />
        <SelectField
          label="Source"
          onChange={(value) => onFieldChange((current) => ({ ...current, source: value as LeadSource }))}
          options={leadSources}
          required
          value={form.source}
        />
        <SelectField
          label="Preferred channel"
          onChange={(value) => onFieldChange((current) => ({ ...current, preferredChannel: value as LeadCommunicationChannel | "" }))}
          options={[{ label: "No preference", value: "" }, ...preferredChannels]}
          value={form.preferredChannel}
        />
        <SelectField
          label="Intent"
          onChange={(value) => onFieldChange((current) => ({ ...current, currentIntent: value as LeadCurrentIntent }))}
          options={leadIntentOptions}
          value={form.currentIntent}
        />
        <SelectField
          label="Batch type preference"
          onChange={(value) => onFieldChange((current) => ({ ...current, batchTypePref: value as BatchTypePref | "" }))}
          options={[{ label: "No preference", value: "" }, ...batchTypeOptions]}
          value={form.batchTypePref}
        />
        <SelectField
          label="Preferred batch"
          onChange={(value) => onFieldChange((current) => ({ ...current, preferredBatchId: value }))}
          options={[
            { label: "No preferred batch", value: "" },
            ...branchBatches.map((batch) => ({
              label: `${batch.name} (${timeRange(batch)})`,
              value: batch.id,
            })),
          ]}
          value={form.preferredBatchId}
        />
        <Input
          label="Source details"
          onChange={(event) => onFieldChange((current) => ({ ...current, sourceDetails: event.target.value }))}
          value={form.sourceDetails}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MultiSelect
          label="Programs"
          onChange={(programIds) => onFieldChange((current) => ({ ...current, programIds }))}
          options={activePrograms.map((program) => ({ label: program.name, value: program.id }))}
          values={form.programIds}
        />
        <MultiSelect
          label="Goals"
          onChange={(goalIds) => onFieldChange((current) => ({ ...current, goalIds }))}
          options={activeGoals.map((goal) => ({ label: goal.name, value: goal.id }))}
          values={form.goalIds}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_12rem_12rem]">
        <DayPicker
          onChange={(preferredDays) => onFieldChange((current) => ({ ...current, preferredDays }))}
          values={form.preferredDays}
        />
        <Input
          label="Start time"
          onChange={(event) => onFieldChange((current) => ({ ...current, preferredStartTime: event.target.value }))}
          type="time"
          value={form.preferredStartTime}
        />
        <Input
          label="End time"
          onChange={(event) => onFieldChange((current) => ({ ...current, preferredEndTime: event.target.value }))}
          type="time"
          value={form.preferredEndTime}
        />
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
        <span>Current summary</span>
        <textarea
          className="min-h-24 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
          onChange={(event) => onFieldChange((current) => ({ ...current, currentSummary: event.target.value }))}
          value={form.currentSummary}
        />
      </label>
    </>
  );
}

export function LeadDetailView({
  activeGoals,
  activePrograms,
  branchBatches,
  lead,
}: {
  activeGoals: Goal[];
  activePrograms: Program[];
  branchBatches: Batch[];
  lead: LeadDetail;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DetailSection title="Identity">
        <DetailItem label="Full name" value={lead.fullName} />
        <DetailItem label="Primary phone" value={lead.primaryPhone} />
        <DetailItem label="Alternate phone" value={lead.alternatePhone} />
        <DetailItem label="Email" value={lead.email} />
        <DetailItem label="Date of birth" value={formatDateOnly(lead.dob)} />
      </DetailSection>
      <DetailSection title="Acquisition">
        <DetailItem label="Source" value={formatEnum(lead.source)} />
        <DetailItem label="Source details" value={lead.sourceDetails} />
        <DetailItem label="Preferred channel" value={formatEnum(lead.preferredChannel)} />
        <DetailItem label="Current intent" value={formatEnum(lead.currentIntent)} />
        <DetailItem label="Current summary" value={lead.currentSummary} />
      </DetailSection>
      <DetailSection title="Preferences">
        <DetailItem label="Batch type" value={formatEnum(lead.batchTypePref)} />
        <DetailItem label="Preferred batch" value={batchNameFor(lead.preferredBatchId, branchBatches)} />
        <DetailItem label="Preferred days" value={formatDays(lead.preferredDays)} />
        <DetailItem label="Preferred time" value={formatPreferredTime(lead.preferredStartTime, lead.preferredEndTime)} />
        <DetailItem label="Programs" value={formatLeadPrograms(lead, activePrograms)} />
        <DetailItem label="Goals" value={formatLeadGoals(lead, activeGoals)} />
      </DetailSection>
      <DetailSection title="Operations">
        <DetailItem label="Stage" value={formatEnum(lead.stage)} />
        <DetailItem label="Status" value={formatEnum(lead.status)} />
        <DetailItem label="Current assignee" value={formatSafeUser(lead.assignedUser)} />
        <DetailItem label="Last contacted" value={formatDateTime(lead.lastContactedAt)} />
        <DetailItem label="Next follow-up" value={formatDateTime(lead.nextFollowUpAt)} />
        <DetailItem label="Last visited" value={formatDateTime(lead.lastVisitedAt)} />
      </DetailSection>
      <DetailSection title="Lifecycle">
        <DetailItem label="Lost reason" value={formatEnum(lead.lostReason)} />
        <DetailItem label="Lost explanation" value={lead.lostExplanation} />
        <DetailItem label="Lost at" value={formatDateTime(lead.lostAt)} />
        <DetailItem label="Re-engaged at" value={formatDateTime(lead.reengagedAt)} />
        <DetailItem label="Archived at" value={formatDateTime(lead.archivedAt)} />
        <DetailItem label="Converted at" value={formatDateTime(lead.convertedAt)} />
      </DetailSection>
      <DetailSection title="Audit">
        <DetailItem label="Created" value={formatDateTime(lead.createdAt)} />
        <DetailItem label="Updated" value={formatDateTime(lead.updatedAt)} />
        <DetailItem label="Created by" value={formatSafeUser(lead.createdByUser)} />
        <DetailItem label="Updated by" value={formatSafeUser(lead.updatedByUser)} />
        <DetailItem label="Archived by" value={formatSafeUser(lead.archivedByUser)} />
      </DetailSection>
    </div>
  );
}
