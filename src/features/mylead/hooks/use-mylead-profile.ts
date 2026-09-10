"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Batch } from "@/lib/api/batches";
import type { Goal } from "@/lib/api/goals";
import {
  getLeadDetail,
  getLeadTimeline,
  recordLeadContact,
  recordLeadVisit,
  scheduleLeadFollowUp,
  updateLeadProfile,
  type LeadDetail,
  type LeadTimelineEvent,
} from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import { emptyForm, emptyVisitForm } from "@/features/leads/constants";
import type { LeadFormState } from "@/features/leads/types";
import { buildUpdatePayload, buildVisitPayload, leadToForm } from "@/features/leads/utils/lead-payloads";
import { addLeadNote, archiveLead, markLeadLost, reactivateLead, reengageLead, type LeadLostReason } from "../api";
import { emptyTask, type TaskDraft, type TaskKind } from "../types";
import { localDateTime } from "../utils";

type Params = {
  activeGoals: Goal[];
  activePrograms: Program[];
  batches: Batch[];
  handleError: (error: unknown, fallback: string) => string;
  leadId: string | null;
  onChanged: () => Promise<void>;
  token: string;
};

export function useMyleadProfile({ activeGoals, activePrograms, batches, handleError, leadId, onChanged, token }: Params) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [timeline, setTimeline] = useState<LeadTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<LeadFormState>(emptyForm);
  const [taskKind, setTaskKind] = useState<TaskKind | null>(null);
  const [task, setTask] = useState<TaskDraft>(emptyTask);
  const [taskError, setTaskError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const requestRef = useRef(0);
  const timelineRequestRef = useRef(0);
  const activeLeadIdRef = useRef(leadId);

  useEffect(() => {
    activeLeadIdRef.current = leadId;
  }, [leadId]);

  const loadTimeline = useCallback(async (id: string) => {
    if (!token) return;
    const requestId = ++timelineRequestRef.current;
    setIsTimelineLoading(true);
    try {
      const result = await getLeadTimeline(token, id, { page: 1, limit: 20 });
      if (activeLeadIdRef.current === id && timelineRequestRef.current === requestId) setTimeline(result.data);
    } catch (apiError) {
      if (activeLeadIdRef.current === id && timelineRequestRef.current === requestId) setError(handleError(apiError, "Unable to load Lead activity."));
    } finally {
      if (activeLeadIdRef.current === id && timelineRequestRef.current === requestId) setIsTimelineLoading(false);
    }
  }, [handleError, token]);

  const loadProfile = useCallback(async () => {
    const requestId = ++requestRef.current;
    if (!token || !leadId) { setLead(null); setTimeline([]); return; }
    setIsLoading(true); setError(""); setNotice(""); setIsEditing(false); setTaskKind(null);
    try {
      const detail = await getLeadDetail(token, leadId);
      if (requestRef.current !== requestId) return;
      setLead(detail); setEditForm(leadToForm(detail));
      void loadTimeline(leadId);
    } catch (apiError) {
      if (requestRef.current !== requestId) return;
      setLead(null); setError(handleError(apiError, "Unable to load Lead profile."));
    } finally {
      if (requestRef.current === requestId) setIsLoading(false);
    }
  }, [handleError, leadId, loadTimeline, token]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadProfile(), 0);
    return () => { window.clearTimeout(timeout); requestRef.current += 1; };
  }, [loadProfile]);

  async function refreshAfterMutation(id: string, updated?: LeadDetail) {
    if (activeLeadIdRef.current !== id) return;
    if (updated) { setLead(updated); setEditForm(leadToForm(updated)); }
    else {
      const detail = await getLeadDetail(token, id);
      if (activeLeadIdRef.current !== id) return;
      setLead(detail); setEditForm(leadToForm(detail));
    }
    await Promise.all([loadTimeline(id), onChanged()]);
  }

  async function saveProfile() {
    if (!lead || isSaving) return;
    const id = lead.id;
    setIsSaving(true); setError("");
    try {
      const branchBatches = batches.filter((item) => item.status === "ACTIVE" && (!item.branchId || item.branchId === lead.branchId));
      const payload = buildUpdatePayload(editForm, branchBatches, activePrograms, activeGoals);
      const updated = await updateLeadProfile(token, lead.id, payload);
      if (activeLeadIdRef.current !== id) return;
      setLead(updated); setEditForm(leadToForm(updated)); setIsEditing(false); setNotice("Profile updated.");
      await Promise.all([loadTimeline(id), onChanged()]);
    } catch (apiError) { if (activeLeadIdRef.current === id) setError(handleError(apiError, "Unable to update Lead.")); }
    finally { setIsSaving(false); }
  }

  function openTask(kind: TaskKind) {
    setTaskKind(kind); setTask(emptyTask); setTaskError("");
  }

  async function submitTask() {
    if (!lead || !taskKind || isSaving) return;
    const id = lead.id;
    setIsSaving(true); setTaskError("");
    try {
      let updated: LeadDetail | undefined;
      if (taskKind === "followup") {
        await scheduleLeadFollowUp(token, lead.id, { scheduledAt: localDateTime(task.date, task.time), channel: task.channel, reasonDetails: required(task.details, "Enter the follow-up reason.") });
      } else if (taskKind === "contact") {
        await recordLeadContact(token, lead.id, { channel: task.channel, outcome: task.outcome, notes: required(task.details, "Enter contact notes.") });
      } else if (taskKind === "visit") {
        await recordLeadVisit(token, lead.id, buildVisitPayload({ ...emptyVisitForm, discussion: required(task.details, "Enter the visit discussion.") }, activePrograms));
      } else if (taskKind === "note") {
        await addLeadNote(token, lead.id, bounded(task.details, "Enter a note.", 2000));
      } else if (taskKind === "lost") {
        const reason = task.reason as LeadLostReason;
        if (!reason) throw new Error("Choose a lost reason.");
        if (reason === "OTHER" && !task.details.trim()) throw new Error("Enter an explanation for Other.");
        updated = await markLeadLost(token, lead.id, reason, task.details.trim() || undefined);
      } else if (taskKind === "reengage") {
        updated = await reengageLead(token, lead.id, task.details.trim() || undefined);
      } else if (taskKind === "archive") {
        updated = await archiveLead(token, lead.id, bounded(task.details, "Enter an archive reason.", 1000));
      } else {
        updated = await reactivateLead(token, lead.id, bounded(task.details, "Enter a reactivation reason.", 1000));
      }
      if (activeLeadIdRef.current !== id) return;
      setTaskKind(null); setNotice(taskNotice(taskKind));
      await refreshAfterMutation(id, updated);
    } catch (apiError) { if (activeLeadIdRef.current === id) setTaskError(handleError(apiError, "Unable to complete this action.")); }
    finally { setIsSaving(false); }
  }

  return {
    lead, timeline, isLoading, isTimelineLoading, error, notice, isEditing, editForm,
    taskKind, task, taskError, isSaving,
    actions: {
      setError, setNotice, setIsEditing, setEditForm, setTask, openTask, submitTask, saveProfile,
      closeTask: () => !isSaving && setTaskKind(null),
      cancelEdit: () => { if (lead) setEditForm(leadToForm(lead)); setIsEditing(false); },
      retry: loadProfile,
    },
  };
}

function required(value: string, message: string) {
  const clean = value.trim(); if (!clean) throw new Error(message); return clean;
}
function bounded(value: string, message: string, max: number) {
  const clean = required(value, message); if (clean.length > max) throw new Error(`Text must be ${max} characters or fewer.`); return clean;
}
function taskNotice(kind: TaskKind) {
  return ({ followup: "Follow-up scheduled.", contact: "Contact recorded.", visit: "Visit recorded.", note: "Note added.", lost: "Lead marked lost.", reengage: "Lead re-engaged.", archive: "Lead archived.", reactivate: "Lead reactivated." })[kind];
}
