import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelLeadFollowUp,
  completeLeadFollowUp,
  getLeadFollowUpDetail,
  listLeadFollowUps,
  rescheduleLeadFollowUp,
  scheduleLeadFollowUp,
  type LeadAssigneeOption,
  type LeadDetail,
  type LeadFollowUpDetail,
  type LeadFollowUpStatus,
  type LeadFollowUpSummary,
  type PaginationMeta,
} from "@/lib/api/leads";
import {
  emptyCancelFollowUpForm,
  emptyCompleteFollowUpForm,
  emptyFollowUpForm,
  emptyRescheduleFollowUpForm,
  pageSize,
} from "../constants";
import type {
  CancelFollowUpFormState,
  CompleteFollowUpFormState,
  FollowUpAction,
  FollowUpFormState,
  LeadProfileTab,
  RescheduleFollowUpFormState,
} from "../types";
import { dateFilterValue } from "../utils/lead-formatters";
import {
  buildCancelPayload,
  buildCompleteFollowUpPayload,
  buildFollowUpPayload,
  buildReschedulePayload,
  defaultFollowUpForm,
} from "../utils/lead-payloads";
import type { HandleLeadApiError } from "./lead-controller-types";

type LeadFollowUpsControllerParams = {
  activeTab: LeadProfileTab;
  handleLeadApiError: HandleLeadApiError;
  lead: LeadDetail | null;
  leadId: string;
  navigateToTab: (tab: LeadProfileTab) => void;
  profileAssignees: LeadAssigneeOption[];
  refreshContacts: (leadId: string) => Promise<void>;
  refreshLeadProfile: (leadId: string) => Promise<LeadDetail | null>;
  refreshTimeline: (leadId: string) => Promise<void>;
  setNotice: (message: string) => void;
  token: string;
};

export function useLeadFollowUpsController({
  activeTab,
  handleLeadApiError,
  lead,
  leadId,
  navigateToTab,
  profileAssignees,
  refreshContacts,
  refreshLeadProfile,
  refreshTimeline,
  setNotice,
  token,
}: LeadFollowUpsControllerParams) {
  const [followUps, setFollowUps] = useState<LeadFollowUpSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<LeadFollowUpStatus | "">("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [scheduledFrom, setScheduledFrom] = useState("");
  const [scheduledTo, setScheduledTo] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<LeadFollowUpDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<FollowUpFormState>(emptyFollowUpForm);
  const [scheduleError, setScheduleError] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [action, setAction] = useState<FollowUpAction | null>(null);
  const [actionFollowUp, setActionFollowUp] = useState<LeadFollowUpSummary | null>(null);
  const [completeForm, setCompleteForm] = useState<CompleteFollowUpFormState>(emptyCompleteFollowUpForm);
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleFollowUpFormState>(emptyRescheduleFollowUpForm);
  const [cancelForm, setCancelForm] = useState<CancelFollowUpFormState>(emptyCancelFollowUpForm);
  const [actionError, setActionError] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const activeLeadIdRef = useRef(leadId);

  useEffect(() => {
    activeLeadIdRef.current = leadId;
    const timeout = window.setTimeout(() => {
      setFollowUps([]);
      setMeta({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
      setPage(1);
      setStatusFilter("");
      setAssignedFilter("");
      setScheduledFrom("");
      setScheduledTo("");
      setOverdueOnly(false);
      setIsLoading(false);
      setError("");
      setDetail(null);
      setIsDetailOpen(false);
      setIsDetailLoading(false);
      setDetailError("");
      setIsScheduleOpen(false);
      setScheduleForm(emptyFollowUpForm);
      setScheduleError("");
      setIsScheduling(false);
      setAction(null);
      setActionFollowUp(null);
      setCompleteForm(emptyCompleteFollowUpForm);
      setRescheduleForm(emptyRescheduleFollowUpForm);
      setCancelForm(emptyCancelFollowUpForm);
      setActionError("");
      setIsSubmittingAction(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [leadId]);

  const loadFollowUps = useCallback(async (currentLeadId: string) => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await listLeadFollowUps(token, currentLeadId, {
        assignedUserId: assignedFilter || undefined,
        limit: pageSize,
        overdueOnly: overdueOnly || undefined,
        page,
        scheduledFrom: dateFilterValue(scheduledFrom, "start"),
        scheduledTo: dateFilterValue(scheduledTo, "end"),
        status: statusFilter || undefined,
      });
      if (activeLeadIdRef.current !== currentLeadId) return;
      setFollowUps(result.data);
      setMeta(result.meta);
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setFollowUps([]);
      setMeta({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
      setError(apiError instanceof Error ? apiError.message : "Unable to load Lead follow-ups.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsLoading(false);
    }
  }, [assignedFilter, handleLeadApiError, overdueOnly, page, scheduledFrom, scheduledTo, statusFilter, token]);

  useEffect(() => {
    if (activeTab !== "followups" || !leadId) return;
    const timeout = window.setTimeout(() => {
      void loadFollowUps(leadId);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [activeTab, leadId, loadFollowUps]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [assignedFilter, overdueOnly, scheduledFrom, scheduledTo, statusFilter]);

  async function refreshWorkflowViews(currentLeadId: string) {
    await Promise.all([
      refreshLeadProfile(currentLeadId),
      refreshTimeline(currentLeadId),
      loadFollowUps(currentLeadId),
      refreshContacts(currentLeadId),
    ]);
  }

  async function openDetail(followUpId: string) {
    if (!token || !leadId) return;
    const currentLeadId = leadId;
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setDetail(null);
    setDetailError("");
    try {
      const followUpDetail = await getLeadFollowUpDetail(token, currentLeadId, followUpId);
      if (activeLeadIdRef.current !== currentLeadId) return;
      setDetail(followUpDetail);
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setDetailError(apiError instanceof Error ? apiError.message : "Unable to load Follow-up detail.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsDetailLoading(false);
    }
  }

  function openScheduleDialog() {
    setScheduleForm(defaultFollowUpForm(lead?.preferredChannel ?? null));
    setScheduleError("");
    setIsScheduleOpen(true);
  }

  function closeScheduleDialog() {
    if (isScheduling) return;
    setIsScheduleOpen(false);
    setScheduleForm(emptyFollowUpForm);
    setScheduleError("");
  }

  async function submitScheduleFollowUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !lead || isScheduling) return;
    const currentLeadId = lead.id;

    setIsScheduling(true);
    setScheduleError("");
    try {
      const payload = buildFollowUpPayload(scheduleForm, profileAssignees);
      await scheduleLeadFollowUp(token, currentLeadId, payload);
      if (activeLeadIdRef.current !== currentLeadId) return;
      setNotice("Follow-up scheduled.");
      setIsScheduleOpen(false);
      setScheduleForm(emptyFollowUpForm);
      await refreshWorkflowViews(currentLeadId);
      navigateToTab("followups");
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setScheduleError(apiError instanceof Error ? apiError.message : "Unable to schedule Follow-up.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsScheduling(false);
    }
  }

  function openActionDialog(nextAction: FollowUpAction, followUp: LeadFollowUpSummary) {
    setAction(nextAction);
    setActionFollowUp(followUp);
    setActionError("");
    setCompleteForm({
      ...emptyCompleteFollowUpForm,
      channel: followUp.channel,
      nextFollowUp: defaultFollowUpForm(followUp.channel),
    });
    setRescheduleForm(emptyRescheduleFollowUpForm);
    setCancelForm(emptyCancelFollowUpForm);
  }

  function closeActionDialog() {
    if (isSubmittingAction) return;
    setAction(null);
    setActionFollowUp(null);
    setActionError("");
    setCompleteForm(emptyCompleteFollowUpForm);
    setRescheduleForm(emptyRescheduleFollowUpForm);
    setCancelForm(emptyCancelFollowUpForm);
  }

  async function submitFollowUpAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !lead || !actionFollowUp || !action || isSubmittingAction) return;
    const currentLeadId = lead.id;

    setIsSubmittingAction(true);
    setActionError("");
    try {
      if (action === "complete") {
        const payload = buildCompleteFollowUpPayload(completeForm, profileAssignees);
        await completeLeadFollowUp(token, currentLeadId, actionFollowUp.id, payload);
        setNotice("Follow-up completed and Contact recorded.");
      } else if (action === "reschedule") {
        const payload = buildReschedulePayload(rescheduleForm);
        await rescheduleLeadFollowUp(token, currentLeadId, actionFollowUp.id, payload);
        setNotice("Follow-up rescheduled.");
      } else {
        const payload = buildCancelPayload(cancelForm);
        await cancelLeadFollowUp(token, currentLeadId, actionFollowUp.id, payload);
        setNotice("Follow-up cancelled.");
      }
      if (activeLeadIdRef.current !== currentLeadId) return;
      setAction(null);
      setActionFollowUp(null);
      setActionError("");
      setCompleteForm(emptyCompleteFollowUpForm);
      setRescheduleForm(emptyRescheduleFollowUpForm);
      setCancelForm(emptyCancelFollowUpForm);
      await refreshWorkflowViews(currentLeadId);
      navigateToTab(action === "complete" ? "contacts" : "followups");
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setActionError(apiError instanceof Error ? apiError.message : "Unable to update Follow-up.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsSubmittingAction(false);
    }
  }

  return {
    action,
    actionError,
    actionFollowUp,
    assignedFilter,
    cancelForm,
    completeForm,
    detail,
    detailError,
    error,
    followUps,
    isDetailLoading,
    isDetailOpen,
    isLoading,
    isScheduleOpen,
    isScheduling,
    isSubmittingAction,
    meta,
    overdueOnly,
    rescheduleForm,
    scheduleError,
    scheduleForm,
    scheduledFrom,
    scheduledTo,
    statusFilter,
    actions: {
      closeActionDialog,
      closeScheduleDialog,
      loadFollowUps,
      openActionDialog,
      openDetail,
      openScheduleDialog,
      setActionError,
      setAssignedFilter,
      setCancelForm,
      setCompleteForm,
      setDetail,
      setDetailError,
      setIsDetailOpen,
      setOverdueOnly,
      setPage,
      setRescheduleForm,
      setScheduleError,
      setScheduleForm,
      setScheduledFrom,
      setScheduledTo,
      setStatusFilter,
      submitFollowUpAction,
      submitScheduleFollowUp,
    },
  };
}
