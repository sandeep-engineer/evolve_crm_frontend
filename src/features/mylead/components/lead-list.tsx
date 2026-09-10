"use client";

import { useMemo, useState } from "react";
import {
  Box, CircularProgress, IconButton, Pagination, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import { ChevronDown, ChevronRight, MessageCircle, Phone } from "lucide-react";
import type { LeadSummary, PaginationMeta } from "@/lib/api/leads";
import { formatDate, formatEnum, groupLeads, phoneHref, whatsappHref, type FollowUpGroup } from "../utils";
import { StatusChip } from "./status-chip";

type Props = {
  isLoading: boolean;
  leads: LeadSummary[];
  meta: PaginationMeta;
  onOpen: (id: string) => void;
  onPageChange: (page: number) => void;
};

const groupLabels: Record<FollowUpGroup, string> = { overdue: "Overdue", today: "Today", upcoming: "Upcoming", unscheduled: "No follow-up" };
const groupColors: Record<FollowUpGroup, { bg: string; fg: string }> = {
  overdue: { bg: "#fff0ef", fg: "#aa2633" },
  today: { bg: "#edf4ff", fg: "#2558a8" },
  upcoming: { bg: "#f7f8fa", fg: "#515c6e" },
  unscheduled: { bg: "#fafafa", fg: "#687386" },
};

export function LeadList(props: Props) {
  const groups = useMemo(() => groupLeads(props.leads), [props.leads]);
  const [collapsed, setCollapsed] = useState<Record<FollowUpGroup, boolean>>({ overdue: false, today: false, upcoming: false, unscheduled: false });
  const entries = (Object.entries(groups) as Array<[FollowUpGroup, LeadSummary[]]>).filter(([, rows]) => rows.length);

  if (props.isLoading && !props.leads.length) {
    return <Stack sx={{ minHeight: 320, alignItems: "center", justifyContent: "center" }}><CircularProgress size={28} /></Stack>;
  }
  if (!props.leads.length) {
    return <Stack spacing={0.5} sx={{ minHeight: 320, px: 2, alignItems: "center", justifyContent: "center" }}><Typography variant="h6">No Leads found</Typography><Typography color="text.secondary" variant="body2">Try a different search, scope or filter.</Typography></Stack>;
  }

  function toggle(group: FollowUpGroup) {
    setCollapsed((current) => ({ ...current, [group]: !current[group] }));
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: "none", md: "block" }, position: "relative" }}>
        {props.isLoading ? <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(255,255,255,.62)", zIndex: 2, display: "grid", placeItems: "center" }}><CircularProgress size={26} /></Box> : null}
        <Table size="small">
          <TableHead><TableRow sx={{ bgcolor: "#fafbfc" }}>
            {['Lead', 'Created', 'Source', 'Summary', 'Stage', 'Next follow-up', 'Actions'].map((label) => <TableCell key={label} sx={{ py: 1.8, fontSize: 12, fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>{label}</TableCell>)}
          </TableRow></TableHead>
          <TableBody>
            {entries.map(([group, rows]) => (
              <GroupRows key={group} group={group} rows={rows} collapsed={collapsed[group]} onToggle={() => toggle(group)} onOpen={props.onOpen} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
        {entries.map(([group, rows]) => (
          <Box key={group}>
            <GroupButton group={group} count={rows.length} collapsed={collapsed[group]} onToggle={() => toggle(group)} />
            {!collapsed[group] ? rows.map((lead) => <MobileLead key={lead.id} lead={lead} onOpen={() => props.onOpen(lead.id)} />) : null}
          </Box>
        ))}
      </Stack>

      {props.meta.totalPages > 1 ? <Stack direction="row" sx={{ pt: 2, justifyContent: "space-between", alignItems: "center" }}><Typography variant="caption" color="text.secondary">Page {props.meta.page} of {props.meta.totalPages}</Typography><Pagination page={props.meta.page} count={props.meta.totalPages} onChange={(_, page) => props.onPageChange(page)} size="small" /></Stack> : null}
    </Box>
  );
}

function GroupRows({ group, rows, collapsed, onToggle, onOpen }: { group: FollowUpGroup; rows: LeadSummary[]; collapsed: boolean; onToggle: () => void; onOpen: (id: string) => void }) {
  return <>
    <TableRow onClick={onToggle} sx={{ cursor: "pointer", bgcolor: groupColors[group].bg }}><TableCell colSpan={7} sx={{ py: 1.15, color: groupColors[group].fg, fontWeight: 800 }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>{collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}<span>{groupLabels[group]}</span><Box component="span" sx={{ px: 0.8, py: 0.15, bgcolor: "rgba(255,255,255,.65)", borderRadius: 6, fontSize: 12 }}>{rows.length}</Box></Stack>
    </TableCell></TableRow>
    {!collapsed ? rows.map((lead) => <LeadRow key={lead.id} lead={lead} onOpen={() => onOpen(lead.id)} />) : null}
  </>;
}

function LeadRow({ lead, onOpen }: { lead: LeadSummary; onOpen: () => void }) {
  return <TableRow hover onClick={onOpen} sx={{ cursor: "pointer", '& td': { py: 1.45 } }}>
    <TableCell><Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}><Avatar name={lead.fullName} /><div><Typography variant="body2" sx={{ fontWeight: 750 }}>{lead.fullName}</Typography><Typography variant="caption" color="text.secondary">{lead.primaryPhone || "No phone"}</Typography></div></Stack></TableCell>
    <TableCell>{formatDate(lead.createdAt)}</TableCell>
    <TableCell>{formatEnum(lead.source)}</TableCell>
    <TableCell sx={{ maxWidth: 190 }}><Typography variant="body2" noWrap>{lead.currentSummary || "Not recorded"}</Typography></TableCell>
    <TableCell><Stack spacing={0.5} sx={{ alignItems: "flex-start" }}><StatusChip value={lead.stage} /><Typography variant="caption" color="text.secondary">{formatEnum(lead.status)}</Typography></Stack></TableCell>
    <TableCell>{lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt, true) : "Not scheduled"}</TableCell>
    <TableCell><ContactActions lead={lead} /></TableCell>
  </TableRow>;
}

function MobileLead({ lead, onOpen }: { lead: LeadSummary; onOpen: () => void }) {
  return <Paper variant="outlined" onClick={onOpen} sx={{ p: 1.5, mt: 1, cursor: "pointer" }}>
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
      <Stack direction="row" spacing={1.1}><Avatar name={lead.fullName} /><div><Typography sx={{ fontWeight: 750 }}>{lead.fullName}</Typography><Typography variant="body2" color="text.secondary">{lead.primaryPhone || "No phone"}</Typography></div></Stack>
      <StatusChip value={lead.stage} />
    </Stack>
    <Stack direction="row" sx={{ mt: 1.25, pt: 1.25, borderTop: 1, borderColor: "divider", alignItems: "center", justifyContent: "space-between" }}>
      <div><Typography variant="caption" color="text.secondary">Next follow-up</Typography><Typography variant="body2">{lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt, true) : "Not scheduled"}</Typography></div>
      <ContactActions lead={lead} />
    </Stack>
  </Paper>;
}

function ContactActions({ lead }: { lead: LeadSummary }) {
  const stop = (event: React.MouseEvent) => event.stopPropagation();
  return <Stack direction="row" spacing={0.5} onClick={stop}>
    <Tooltip title="Call"><span><IconButton component="a" href={phoneHref(lead.primaryPhone)} disabled={!lead.primaryPhone} size="small" aria-label={`Call ${lead.fullName}`}><Phone size={17} /></IconButton></span></Tooltip>
    <Tooltip title="WhatsApp"><span><IconButton component="a" href={whatsappHref(lead.primaryPhone)} target="_blank" rel="noreferrer" disabled={!lead.primaryPhone} size="small" color="success" aria-label={`WhatsApp ${lead.fullName}`}><MessageCircle size={17} /></IconButton></span></Tooltip>
  </Stack>;
}

function GroupButton({ group, count, collapsed, onToggle }: { group: FollowUpGroup; count: number; collapsed: boolean; onToggle: () => void }) {
  return <Stack direction="row" spacing={0.75} onClick={onToggle} sx={{ px: 1.25, py: 1, bgcolor: groupColors[group].bg, color: groupColors[group].fg, fontWeight: 800, cursor: "pointer", borderRadius: 1, alignItems: "center" }}>
    {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}<Typography variant="body2" sx={{ fontWeight: 800 }}>{groupLabels[group]}</Typography><Typography variant="caption">{count}</Typography>
  </Stack>;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <Box sx={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#eaf0ff", color: "primary.dark", fontWeight: 800, flex: "0 0 auto" }}>{initials || "L"}</Box>;
}
