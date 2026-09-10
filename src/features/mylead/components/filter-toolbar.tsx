"use client";

import { Button, MenuItem, Stack, TextField } from "@mui/material";
import { RotateCcw } from "lucide-react";
import type { Program } from "@/lib/api/programs";
import { leadSources, leadStages, leadStatuses } from "@/features/leads/constants";
import type { MyleadFilters } from "../types";

type Props = {
  filters: MyleadFilters;
  onChange: (next: MyleadFilters) => void;
  onReset: () => void;
  programs: Program[];
};

export function FilterToolbar({ filters, onChange, onReset, programs }: Props) {
  const update = <Key extends keyof MyleadFilters>(key: Key, value: MyleadFilters[Key]) => onChange({ ...filters, [key]: value });
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <Stack direction="row" spacing={1} sx={{ px: { xs: 2, md: 3 }, py: 1.5, overflowX: "auto", borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
      <TextField select size="small" label="Source" value={filters.source} onChange={(event) => update("source", event.target.value as MyleadFilters["source"])} sx={{ minWidth: 150 }}>
        <MenuItem value="">All sources</MenuItem>
        {leadSources.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
      </TextField>
      <TextField select size="small" label="Program" value={filters.programId} onChange={(event) => update("programId", event.target.value)} sx={{ minWidth: 160 }}>
        <MenuItem value="">All programs</MenuItem>
        {programs.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
      </TextField>
      <TextField select size="small" label="Stage" value={filters.stage} onChange={(event) => update("stage", event.target.value as MyleadFilters["stage"])} sx={{ minWidth: 150 }}>
        <MenuItem value="">All stages</MenuItem>
        {leadStages.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
      </TextField>
      <TextField select size="small" label="Status" value={filters.status} onChange={(event) => update("status", event.target.value as MyleadFilters["status"])} sx={{ minWidth: 145 }}>
        <MenuItem value="">All statuses</MenuItem>
        {leadStatuses.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
      </TextField>
      <TextField size="small" label="Created from" type="date" value={filters.createdFrom} onChange={(event) => update("createdFrom", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 155 }} />
      <TextField size="small" label="Created to" type="date" value={filters.createdTo} onChange={(event) => update("createdTo", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 155 }} />
      {hasFilters ? <Button color="inherit" startIcon={<RotateCcw size={16} />} onClick={onReset}>Reset</Button> : null}
    </Stack>
  );
}
