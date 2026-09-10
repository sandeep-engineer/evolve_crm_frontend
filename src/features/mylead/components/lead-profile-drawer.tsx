"use client";

import { useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  Drawer, IconButton, Menu, MenuItem, Stack, Typography,
} from "@mui/material";
import { Archive, CalendarClock, ClipboardList, Edit3, EllipsisVertical, MessageCircle, Phone, RotateCcw, StickyNote, UserRoundX, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Batch } from "@/lib/api/batches";
import type { AuthUser } from "@/lib/api/auth";
import type { Goal } from "@/lib/api/goals";
import type { LeadDetail, LeadTimelineEvent } from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import type { LeadFormState } from "@/features/leads/types";
import type { TaskDraft, TaskKind } from "../types";
import { formatDate, formatEnum, phoneHref, whatsappHref } from "../utils";
import { ActivityTimeline } from "./activity-timeline";
import { LeadForm } from "./lead-form";
import { StatusChip } from "./status-chip";
import { TaskDialog } from "./task-dialog";

type Props = {
  batches: Batch[]; editForm: LeadFormState; error: string; goals: Goal[]; isEditing: boolean; isLoading: boolean;
  isSaving: boolean; isTimelineLoading: boolean; lead: LeadDetail | null; notice: string; onClose: () => void;
  onEditCancel: () => void; onEditChange: (form: LeadFormState) => void; onEditOpen: () => void; onEditSave: () => void;
  onTaskChange: (task: TaskDraft) => void; onTaskClose: () => void; onTaskOpen: (kind: TaskKind) => void; onTaskSubmit: () => void;
  open: boolean; programs: Program[]; task: TaskDraft; taskError: string; taskKind: TaskKind | null; timeline: LeadTimelineEvent[];
  userRole: AuthUser["role"];
};

export function LeadProfileDrawer(props: Props) {
  return <>
    <Drawer anchor="right" open={props.open} onClose={props.isSaving ? undefined : props.onClose} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 620 }, maxWidth: "100%" } } }}>
      <ProfileContent {...props} />
    </Drawer>
    <Dialog open={props.isEditing} onClose={props.isSaving ? undefined : props.onEditCancel} fullWidth maxWidth="md">
      <DialogTitle>Edit Lead</DialogTitle><DialogContent dividers><LeadForm form={props.editForm} onChange={props.onEditChange} programs={props.programs} goals={props.goals} batches={props.batches} /></DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}><Button color="inherit" onClick={props.onEditCancel} disabled={props.isSaving}>Cancel</Button><Button variant="contained" onClick={props.onEditSave} disabled={props.isSaving}>{props.isSaving ? "Saving..." : "Save changes"}</Button></DialogActions>
    </Dialog>
    <TaskDialog batches={props.batches} kind={props.taskKind} lead={props.lead} programs={props.programs} task={props.task} error={props.taskError} isSaving={props.isSaving} onChange={props.onTaskChange} onClose={props.onTaskClose} onSubmit={props.onTaskSubmit} />
  </>;
}

function ProfileContent(props: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (props.isLoading && !props.lead) return <Stack sx={{ height: "100%", alignItems: "center", justifyContent: "center" }}><CircularProgress size={28} /></Stack>;
  if (!props.lead) return <Stack spacing={2} sx={{ p: 3 }}><Stack direction="row" sx={{ justifyContent: "flex-end" }}><IconButton onClick={props.onClose}><X /></IconButton></Stack><Alert severity="error">{props.error || "Lead not found or unavailable in your scope."}</Alert></Stack>;
  const lead = props.lead;
  const actions = actionItems(lead, props.userRole);

  return <Stack sx={{ height: "100%", overflow: "hidden" }}>
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <div><Typography variant="h5">{lead.fullName}</Typography><Typography color="text.secondary" variant="body2">{lead.primaryPhone || "No primary phone"}</Typography></div>
        <Stack direction="row"><IconButton aria-label="Edit Lead" onClick={props.onEditOpen}><Edit3 size={19} /></IconButton><IconButton aria-label="Close profile" onClick={props.onClose}><X size={21} /></IconButton></Stack>
      </Stack>
      <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: "wrap" }}><StatusChip value={lead.stage} /><StatusChip value={lead.status} /></Stack>
    </Box>
    <Divider />
    <Stack direction="row" spacing={1} sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
      <Button fullWidth variant="outlined" color="inherit" component="a" href={phoneHref(lead.primaryPhone)} disabled={!lead.primaryPhone} startIcon={<Phone size={17} />}>Call</Button>
      <Button fullWidth variant="outlined" color="success" component="a" href={whatsappHref(lead.primaryPhone)} target="_blank" rel="noreferrer" disabled={!lead.primaryPhone} startIcon={<MessageCircle size={17} />}>WhatsApp</Button>
      <Button fullWidth variant="contained" onClick={(event) => setAnchor(event.currentTarget)} endIcon={<EllipsisVertical size={16} />}>Task</Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>{actions.map((item) => <MenuItem key={item.kind} onClick={() => { setAnchor(null); props.onTaskOpen(item.kind); }}><item.icon size={17} style={{ marginRight: 10 }} />{item.label}</MenuItem>)}</Menu>
    </Stack>
    <Divider />
    <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 3 }, py: 2.5 }}>
      {props.error ? <Alert severity="error" sx={{ mb: 2 }}>{props.error}</Alert> : null}
      {props.notice ? <Alert severity="success" sx={{ mb: 2 }}>{props.notice}</Alert> : null}
      <Section title="Essential information"><InfoGrid items={[
        ["Email", lead.email], ["Source", formatEnum(lead.source)], ["Branch", lead.branch?.name], ["Created", formatDate(lead.createdAt, true)],
        ["Programs", lead.interests.map((item) => item.program?.name).filter(Boolean).join(", ")], ["Goals", lead.goals.map((item) => item.goal?.name).filter(Boolean).join(", ")],
        ["Next follow-up", formatDate(lead.nextFollowUpAt, true)], ["Last contact", formatDate(lead.lastContactedAt, true)],
      ]} /></Section>
      {lead.currentSummary ? <Section title="Current summary"><Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{lead.currentSummary}</Typography></Section> : null}
      <Section title="Preferences"><InfoGrid items={[
        ["Preferred channel", formatEnum(lead.preferredChannel)], ["Current intent", formatEnum(lead.currentIntent)], ["Batch type", formatEnum(lead.batchTypePref)],
        ["Preferred time", preferredTime(lead.preferredStartTime, lead.preferredEndTime)], ["Date of birth", formatDate(lead.dob)], ["Alternate phone", lead.alternatePhone],
      ]} /></Section>
      <Section title="Activity"><ActivityTimeline events={props.timeline} isLoading={props.isTimelineLoading} error="" /></Section>
    </Box>
  </Stack>;
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return <Box sx={{ mb: 3 }}><Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>{title}</Typography><Box sx={{ mt: 1 }}>{children}</Box></Box>;
}

function InfoGrid({ items }: { items: Array<[string, string | null | undefined]> }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" }, gap: 1.5 }}>{items.map(([label, value]) => <Box key={label}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" sx={{ fontWeight: 650, overflowWrap: "anywhere" }}>{value || "Not recorded"}</Typography></Box>)}</Box>;
}

function preferredTime(start?: string | null, end?: string | null) { return start && end ? `${start.slice(0, 5)} – ${end.slice(0, 5)}` : ""; }

type ActionItem = { icon: LucideIcon; kind: TaskKind; label: string };
function actionItems(lead: LeadDetail, role: AuthUser["role"]): ActionItem[] {
  if (lead.status === "ARCHIVED") return [{ icon: RotateCcw, kind: "reactivate", label: "Reactivate Lead" }];
  const base: ActionItem[] = role === "BRANCH_ADMIN" || role === "RECEPTIONIST" ? [{ icon: CalendarClock, kind: "followup", label: "Schedule follow-up" }] : [];
  base.push({ icon: MessageCircle, kind: "contact", label: "Record contact" }, { icon: ClipboardList, kind: "visit", label: "Record visit" }, { icon: StickyNote, kind: "note", label: "Add note" });
  if (lead.stage === "LOST") base.push({ icon: RotateCcw, kind: "reengage", label: "Re-engage Lead" });
  else if (lead.stage !== "CONVERTED") base.push({ icon: UserRoundX, kind: "lost", label: "Mark lost" });
  if (lead.stage !== "CONVERTED") base.push({ icon: Archive, kind: "archive", label: "Archive Lead" });
  return base;
}
