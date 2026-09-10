"use client";

import { Autocomplete, Box, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { Batch } from "@/lib/api/batches";
import type { Goal } from "@/lib/api/goals";
import type { Program } from "@/lib/api/programs";
import { batchTypeOptions, dayOptions, leadIntentOptions, leadSources, preferredChannels } from "@/features/leads/constants";
import type { LeadFormState } from "@/features/leads/types";

type Props = {
  batches: Batch[];
  form: LeadFormState;
  goals: Goal[];
  onChange: (form: LeadFormState) => void;
  programs: Program[];
};

export function LeadForm({ batches, form, goals, onChange, programs }: Props) {
  const update = <Key extends keyof LeadFormState>(key: Key, value: LeadFormState[Key]) => onChange({ ...form, [key]: value });
  const selectedPrograms = programs.filter((item) => form.programIds.includes(item.id));
  const selectedGoals = goals.filter((item) => form.goalIds.includes(item.id));

  return (
    <Stack spacing={2.25}>
      <SectionTitle title="Contact details" />
      <Box sx={gridSx}>
        <TextField required label="Full name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} autoFocus />
        <TextField required label="Primary phone" value={form.primaryPhone} onChange={(event) => update("primaryPhone", event.target.value)} inputMode="tel" />
        <TextField label="Alternate phone" value={form.alternatePhone} onChange={(event) => update("alternatePhone", event.target.value)} inputMode="tel" />
        <TextField label="Email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
        <TextField label="Date of birth" type="date" value={form.dob} onChange={(event) => update("dob", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField select label="Preferred contact" value={form.preferredChannel} onChange={(event) => update("preferredChannel", event.target.value as LeadFormState["preferredChannel"])}>
          <MenuItem value="">Not set</MenuItem>{preferredChannels.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
        </TextField>
      </Box>

      <SectionTitle title="Enquiry" />
      <Box sx={gridSx}>
        <TextField required select label="Source" value={form.source} onChange={(event) => update("source", event.target.value as LeadFormState["source"])}>
          {leadSources.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
        </TextField>
        <TextField label="Source details" value={form.sourceDetails} onChange={(event) => update("sourceDetails", event.target.value)} />
        <Autocomplete multiple options={programs} value={selectedPrograms} getOptionLabel={(item) => item.name} onChange={(_, selected) => update("programIds", selected.map((item) => item.id))} renderInput={(params) => <TextField {...params} label="Programs" />} />
        <Autocomplete multiple options={goals} value={selectedGoals} getOptionLabel={(item) => item.name} onChange={(_, selected) => update("goalIds", selected.map((item) => item.id))} renderInput={(params) => <TextField {...params} label="Goals" />} />
        <TextField select label="Current intent" value={form.currentIntent} onChange={(event) => update("currentIntent", event.target.value as LeadFormState["currentIntent"])}>
          {leadIntentOptions.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
        </TextField>
        <TextField select label="Batch preference" value={form.batchTypePref} onChange={(event) => update("batchTypePref", event.target.value as LeadFormState["batchTypePref"])}>
          <MenuItem value="">Not set</MenuItem>{batchTypeOptions.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
        </TextField>
        <TextField select label="Preferred batch" value={form.preferredBatchId} onChange={(event) => update("preferredBatchId", event.target.value)}>
          <MenuItem value="">Not set</MenuItem>{batches.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </TextField>
        <Autocomplete multiple options={dayOptions} value={dayOptions.filter((item) => form.preferredDays.includes(item.value))} getOptionLabel={(item) => item.label} isOptionEqualToValue={(option, value) => option.value === value.value} onChange={(_, selected) => update("preferredDays", selected.map((item) => item.value))} renderInput={(params) => <TextField {...params} label="Preferred days" />} />
        <TextField label="Preferred start" type="time" value={form.preferredStartTime} onChange={(event) => update("preferredStartTime", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Preferred end" type="time" value={form.preferredEndTime} onChange={(event) => update("preferredEndTime", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
      <TextField label="Current summary" value={form.currentSummary} onChange={(event) => update("currentSummary", event.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 1000 } }} />
    </Stack>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>{title}</Typography>;
}

const gridSx = { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 };
