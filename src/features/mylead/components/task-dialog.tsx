"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowRight } from "lucide-react";
import type { Batch } from "@/lib/api/batches";
import type { LeadDetail } from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import { contactOutcomeOptions, preferredChannels } from "@/features/leads/constants";
import type { LeadLostReason } from "../api";
import type { TaskDraft, TaskKind } from "../types";
import { formatEnum } from "../utils";

type Props = {
  batches: Batch[];
  error: string;
  isSaving: boolean;
  kind: TaskKind | null;
  lead: LeadDetail | null;
  onChange: (task: TaskDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
  programs: Program[];
  task: TaskDraft;
};

const titles: Record<TaskKind, string> = {
  followup: "Task",
  contact: "Record contact",
  visit: "Record visit",
  note: "Add note",
  lost: "Mark Lead lost",
  reengage: "Re-engage Lead",
  archive: "Archive Lead",
  reactivate: "Reactivate Lead",
};
const reasons: LeadLostReason[] = ["NOT_INTERESTED", "PRICE_TOO_HIGH", "LOCATION_ISSUE", "TIMING_ISSUE", "JOINED_COMPETITOR", "UNREACHABLE", "DUPLICATE", "INVALID_CONTACT", "OTHER"];

export function TaskDialog(props: Props) {
  const kind = props.kind;
  const update = <Key extends keyof TaskDraft>(key: Key, value: TaskDraft[Key]) => props.onChange({ ...props.task, [key]: value });
  const followUpIncomplete = kind === "followup" && (!props.task.date || !props.task.time || !props.task.details.trim());

  return <Dialog
    open={Boolean(kind)}
    onClose={props.isSaving ? undefined : props.onClose}
    fullWidth
    maxWidth={kind === "followup" ? false : "sm"}
    slotProps={{ paper: { sx: kind === "followup" ? { m: { xs: 1.5, sm: 3 }, width: 840, maxWidth: "calc(100% - 24px)", borderRadius: 2 } : undefined } }}
  >
    <DialogTitle sx={kind === "followup" ? { px: { xs: 2.5, sm: 6 }, pt: { xs: 3, sm: 5.5 }, pb: 2, fontSize: { xs: 26, sm: 32 }, fontWeight: 800 } : undefined}>
      {kind ? titles[kind] : "Lead action"}
    </DialogTitle>
    <DialogContent dividers={kind !== "followup"} sx={kind === "followup" ? { px: { xs: 2.5, sm: 6 }, pt: 1, pb: 1 } : undefined}>
      {kind === "followup" ? <FollowUpTaskFields {...props} update={update} /> : <Stack spacing={2}>
        {props.error ? <Alert severity="error">{props.error}</Alert> : null}
        {kind === "contact" ? <><ChannelField value={props.task.channel} onChange={(value) => update("channel", value)} /><TextField select label="Outcome" value={props.task.outcome} onChange={(event) => update("outcome", event.target.value as TaskDraft["outcome"])}>{contactOutcomeOptions.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField></> : null}
        {kind === "lost" ? <TextField select required label="Reason" value={props.task.reason} onChange={(event) => update("reason", event.target.value)}>{reasons.map((reason) => <MenuItem key={reason} value={reason}>{formatEnum(reason)}</MenuItem>)}</TextField> : null}
        <TextField required={kind !== "reengage" && kind !== "lost"} autoFocus={kind !== "contact" && kind !== "lost"} multiline minRows={3} label={detailsLabel(kind)} value={props.task.details} onChange={(event) => update("details", event.target.value)} slotProps={{ htmlInput: { maxLength: kind === "note" || kind === "visit" || kind === "contact" ? 2000 : 1000 } }} />
      </Stack>}
    </DialogContent>
    <DialogActions sx={kind === "followup" ? { px: { xs: 2.5, sm: 6 }, pt: 2.5, pb: { xs: 3, sm: 5 }, gap: 1.5 } : { px: 3, py: 2 }}>
      <Button color="inherit" variant={kind === "followup" ? "outlined" : "text"} onClick={props.onClose} disabled={props.isSaving} sx={kind === "followup" ? { minWidth: 126, minHeight: 58, fontSize: 20 } : undefined}>Cancel</Button>
      <Button variant="contained" onClick={props.onSubmit} disabled={props.isSaving || followUpIncomplete} sx={kind === "followup" ? { minWidth: 132, minHeight: 58, fontSize: 20 } : undefined}>{props.isSaving ? "Saving..." : "Save"}</Button>
    </DialogActions>
  </Dialog>;
}

function FollowUpTaskFields(props: Props & { update: <Key extends keyof TaskDraft>(key: Key, value: TaskDraft[Key]) => void }) {
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(() => props.lead?.interests.map((interest) => interest.programId) ?? []);
  const [batchType, setBatchType] = useState(() => props.lead?.batchTypePref ?? "GROUP_BATCH");
  const [trialDate, setTrialDate] = useState("");
  const [batchId, setBatchId] = useState(() => props.lead?.preferredBatchId ?? "");

  const currentStage = formatEnum(props.lead?.stage ?? "NEW");
  const toggleProgram = (programId: string) => setSelectedPrograms((current) => current.includes(programId) ? current.filter((id) => id !== programId) : [...current, programId]);

  return <Stack spacing={3.25}>
    {props.error ? <Alert severity="error">{props.error}</Alert> : null}
    <Labeled label="Move to">
      <Stack direction="row" spacing={{ xs: 1.25, sm: 2.5 }} sx={{ alignItems: "center" }}>
        <Box sx={{ px: 2.5, minHeight: 64, display: "grid", placeItems: "center", bgcolor: "#f0f1f3", borderRadius: 1.5 }}><Typography sx={{ fontSize: 20, fontWeight: 750 }}>{currentStage}</Typography></Box>
        <ArrowRight aria-hidden size={27} color="#777d87" />
        <TextField select fullWidth value="TRIAL_SCHEDULED" aria-label="Move Lead to"><MenuItem value="TRIAL_SCHEDULED">Trial Scheduled</MenuItem></TextField>
      </Stack>
    </Labeled>
    <Labeled label="Interest (select any)">
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.25 }}>
        {props.programs.map((program) => <Button key={program.id} variant={selectedPrograms.includes(program.id) ? "contained" : "outlined"} onClick={() => toggleProgram(program.id)} sx={{ minHeight: 48, px: 2.5, borderRadius: 3, fontSize: 19 }}>{program.name}</Button>)}
      </Stack>
    </Labeled>
    <Labeled label="Batch Type">
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5 }}>
        <Button variant={batchType === "GROUP_BATCH" ? "contained" : "outlined"} onClick={() => setBatchType("GROUP_BATCH")} sx={{ minHeight: 54, px: 3, borderRadius: 3, fontSize: 19 }}>Group Batch</Button>
        <Button variant={batchType === "PERSONAL_TRAINING" ? "contained" : "outlined"} onClick={() => setBatchType("PERSONAL_TRAINING")} sx={{ minHeight: 54, px: 3, borderRadius: 3, fontSize: 19 }}>Personal Training</Button>
      </Stack>
    </Labeled>
    <Labeled label="Preferred Trial Date & Batch Time">
      <ResponsiveFields>
        <TextField fullWidth type="date" value={trialDate} onChange={(event) => setTrialDate(event.target.value)} slotProps={{ htmlInput: { "aria-label": "Preferred trial date" } }} />
        <TextField select fullWidth value={batchId} onChange={(event) => setBatchId(event.target.value)} slotProps={{ select: { displayEmpty: true } }}>
          <MenuItem value="">Select batch time</MenuItem>
          {props.batches.map((batch) => <MenuItem key={batch.id} value={batch.id}>{batch.name}</MenuItem>)}
        </TextField>
      </ResponsiveFields>
    </Labeled>
    <Labeled label="Reminder Date & Time">
      <ResponsiveFields>
        <TextField fullWidth required type="date" value={props.task.date} onChange={(event) => props.update("date", event.target.value)} slotProps={{ htmlInput: { "aria-label": "Reminder date" } }} />
        <TextField fullWidth required type="time" value={props.task.time} onChange={(event) => props.update("time", event.target.value)} slotProps={{ htmlInput: { "aria-label": "Reminder time" } }} />
      </ResponsiveFields>
    </Labeled>
    <Labeled label="Remark">
      <TextField fullWidth required placeholder="e.g. Interested in weekend batch" value={props.task.details} onChange={(event) => props.update("details", event.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
    </Labeled>
  </Stack>;
}

function Labeled({ children, label }: { children: React.ReactNode; label: string }) {
  return <Stack spacing={1}><Typography sx={{ color: "#464b54", fontSize: { xs: 18, sm: 21 }, fontWeight: 750 }}>{label}</Typography>{children}</Stack>;
}

function ResponsiveFields({ children }: { children: React.ReactNode }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" }, gap: 2 }}>{children}</Box>;
}

function ChannelField({ value, onChange }: { value: TaskDraft["channel"]; onChange: (value: TaskDraft["channel"]) => void }) {
  return <TextField select label="Channel" value={value} onChange={(event) => onChange(event.target.value as TaskDraft["channel"])}>{preferredChannels.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField>;
}

function detailsLabel(kind: TaskKind | null) {
  if (kind === "contact") return "Contact notes";
  if (kind === "visit") return "Visit discussion";
  if (kind === "note") return "Note";
  if (kind === "lost") return "Explanation (optional)";
  if (kind === "reengage") return "Re-engagement note (optional)";
  return "Reason";
}
