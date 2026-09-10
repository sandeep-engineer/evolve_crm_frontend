"use client";

import { Alert, Box, Button, CircularProgress, Collapse, Stack, Typography } from "@mui/material";
import { Archive, CalendarClock, ChevronDown, ChevronUp, CircleUserRound, ClipboardList, FilePenLine, MessageSquare, RotateCcw, StickyNote, UserRoundX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LeadTimelineEvent, LeadTimelineEventType } from "@/lib/api/leads";
import { timelineDetails } from "@/features/leads/utils/lead-timeline-details";
import { formatDate, formatEnum } from "../utils";
import { useState } from "react";

type Props = { error: string; events: LeadTimelineEvent[]; isLoading: boolean };

const eventIcons: Partial<Record<LeadTimelineEventType, LucideIcon>> = {
  LEAD_CREATED: CircleUserRound,
  LEAD_PROFILE_UPDATED: FilePenLine,
  LEAD_VISIT_RECORDED: ClipboardList,
  FOLLOW_UP_SCHEDULED: CalendarClock,
  FOLLOW_UP_COMPLETED: CalendarClock,
  FOLLOW_UP_RESCHEDULED: CalendarClock,
  FOLLOW_UP_CANCELLED: CalendarClock,
  LEAD_CONTACT_RECORDED: MessageSquare,
  LEAD_NOTE_ADDED: StickyNote,
  LEAD_MARKED_LOST: UserRoundX,
  LEAD_REENGAGED: RotateCcw,
  LEAD_ARCHIVED: Archive,
  LEAD_REACTIVATED: RotateCcw,
};

export function ActivityTimeline({ error, events, isLoading }: Props) {
  if (error) return <Alert severity="error">{error}</Alert>;
  if (isLoading && !events.length) return <Stack sx={{ py: 5, alignItems: "center" }}><CircularProgress size={24} /></Stack>;
  const visibleEvents = events.filter((event) => event.eventType !== "LEAD_ASSIGNMENT_CHANGED");
  if (!visibleEvents.length) return <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: "center" }}>No Lead activity has been recorded.</Typography>;

  return <Stack>{visibleEvents.map((event, index) => <TimelineItem key={event.id} event={event} isLast={index === visibleEvents.length - 1} />)}</Stack>;
}

function TimelineItem({ event, isLast }: { event: LeadTimelineEvent; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = eventIcons[event.eventType] ?? ClipboardList;
  const details = timelineDetails(event).filter((detail) => !/assign/i.test(detail.label));
  const actor = event.actorUser ? `${event.actorUser.name} · ${formatEnum(event.actorUser.role)}` : "Recorded by system";
  return <Stack direction="row" spacing={1.5}>
    <Stack sx={{ width: 34, flex: "0 0 34px", alignItems: "center" }}>
      <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "primary.main", bgcolor: "primary.light" }}><Icon size={16} /></Box>
      {!isLast ? <Box sx={{ width: 2, minHeight: 58, flex: 1, bgcolor: "divider" }} /> : null}
    </Stack>
    <Box sx={{ flex: 1, pb: isLast ? 0 : 2.5, minWidth: 0 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}>
        <div><Typography variant="body2" sx={{ fontWeight: 800 }}>{formatEnum(event.eventType.replace(/^LEAD_/, ""))}</Typography><Typography variant="body2" color="text.secondary">{event.summary}</Typography></div>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{formatDate(event.occurredAt, true)}</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary">{actor}</Typography>
      {details.length ? <>
        <Button size="small" color="inherit" onClick={() => setExpanded((value) => !value)} endIcon={expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} sx={{ mt: 0.5, px: 0 }}>Details</Button>
        <Collapse in={expanded}><Box component="dl" sx={{ m: 0, mt: 0.5, p: 1.25, bgcolor: "#f7f8fa", display: "grid", gridTemplateColumns: { sm: "repeat(2, minmax(0,1fr))" }, gap: 1 }}>
          {details.map((detail) => <Box key={detail.label}><Typography component="dt" variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{detail.label}</Typography><Typography component="dd" variant="body2" sx={{ m: 0, overflowWrap: "anywhere" }}>{detail.value}</Typography></Box>)}
        </Box></Collapse>
      </> : null}
    </Box>
  </Stack>;
}
