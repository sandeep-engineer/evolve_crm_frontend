"use client";

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { contactOutcomeOptions, preferredChannels } from "@/features/leads/constants";
import type { LeadLostReason } from "../api";
import type { TaskDraft, TaskKind } from "../types";
import { formatEnum } from "../utils";

type Props = { error: string; isSaving: boolean; kind: TaskKind | null; onChange: (task: TaskDraft) => void; onClose: () => void; onSubmit: () => void; task: TaskDraft };

const titles: Record<TaskKind, string> = { followup: "Schedule follow-up", contact: "Record contact", visit: "Record visit", note: "Add note", lost: "Mark Lead lost", reengage: "Re-engage Lead", archive: "Archive Lead", reactivate: "Reactivate Lead" };
const reasons: LeadLostReason[] = ["NOT_INTERESTED", "PRICE_TOO_HIGH", "LOCATION_ISSUE", "TIMING_ISSUE", "JOINED_COMPETITOR", "UNREACHABLE", "DUPLICATE", "INVALID_CONTACT", "OTHER"];

export function TaskDialog(props: Props) {
  const kind = props.kind;
  const update = <Key extends keyof TaskDraft>(key: Key, value: TaskDraft[Key]) => props.onChange({ ...props.task, [key]: value });
  return <Dialog open={Boolean(kind)} onClose={props.isSaving ? undefined : props.onClose} fullWidth maxWidth="sm">
    <DialogTitle>{kind ? titles[kind] : "Lead action"}</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        {props.error ? <Alert severity="error">{props.error}</Alert> : null}
        {kind === "followup" ? <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField fullWidth required type="date" label="Date" value={props.task.date} onChange={(event) => update("date", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField fullWidth required type="time" label="Time" value={props.task.time} onChange={(event) => update("time", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Stack>
          <ChannelField value={props.task.channel} onChange={(value) => update("channel", value)} />
        </> : null}
        {kind === "contact" ? <><ChannelField value={props.task.channel} onChange={(value) => update("channel", value)} /><TextField select label="Outcome" value={props.task.outcome} onChange={(event) => update("outcome", event.target.value as TaskDraft["outcome"])}>{contactOutcomeOptions.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField></> : null}
        {kind === "lost" ? <TextField select required label="Reason" value={props.task.reason} onChange={(event) => update("reason", event.target.value)}>{reasons.map((reason) => <MenuItem key={reason} value={reason}>{formatEnum(reason)}</MenuItem>)}</TextField> : null}
        <TextField required={kind !== "reengage" && kind !== "lost"} autoFocus={kind !== "followup" && kind !== "contact" && kind !== "lost"} multiline minRows={3} label={detailsLabel(kind)} value={props.task.details} onChange={(event) => update("details", event.target.value)} slotProps={{ htmlInput: { maxLength: kind === "note" || kind === "visit" || kind === "contact" ? 2000 : 1000 } }} />
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" onClick={props.onClose} disabled={props.isSaving}>Cancel</Button><Button variant="contained" onClick={props.onSubmit} disabled={props.isSaving}>{props.isSaving ? "Saving..." : "Save"}</Button></DialogActions>
  </Dialog>;
}

function ChannelField({ value, onChange }: { value: TaskDraft["channel"]; onChange: (value: TaskDraft["channel"]) => void }) {
  return <TextField select label="Channel" value={value} onChange={(event) => onChange(event.target.value as TaskDraft["channel"])}>{preferredChannels.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField>;
}

function detailsLabel(kind: TaskKind | null) {
  if (kind === "followup") return "Follow-up reason";
  if (kind === "contact") return "Contact notes";
  if (kind === "visit") return "Visit discussion";
  if (kind === "note") return "Note";
  if (kind === "lost") return "Explanation (optional)";
  if (kind === "reengage") return "Re-engagement note (optional)";
  return "Reason";
}
