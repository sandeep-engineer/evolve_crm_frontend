import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getLeadVisitDetail,
  listLeadVisits,
  recordLeadVisit,
  type LeadDetail,
  type LeadVisitDetail,
  type LeadVisitSummary,
  type PaginationMeta,
} from "@/lib/api/leads";
import type { Program } from "@/lib/api/programs";
import { emptyVisitForm, pageSize } from "../constants";
import type { LeadProfileTab, VisitFormState } from "../types";
import { buildVisitPayload } from "../utils/lead-payloads";
import type { HandleLeadApiError } from "./lead-controller-types";

type LeadVisitsControllerParams = {
  activePrograms: Program[];
  activeTab: LeadProfileTab;
  handleLeadApiError: HandleLeadApiError;
  lead: LeadDetail | null;
  leadId: string;
  navigateToTab: (tab: LeadProfileTab) => void;
  refreshLeadProfile: (leadId: string) => Promise<LeadDetail | null>;
  refreshTimeline: (leadId: string) => Promise<void>;
  setNotice: (message: string) => void;
  token: string;
};

export function useLeadVisitsController({
  activePrograms,
  activeTab,
  handleLeadApiError,
  lead,
  leadId,
  navigateToTab,
  refreshLeadProfile,
  refreshTimeline,
  setNotice,
  token,
}: LeadVisitsControllerParams) {
  const [visits, setVisits] = useState<LeadVisitSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<LeadVisitDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [form, setForm] = useState<VisitFormState>(emptyVisitForm);
  const [formError, setFormError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const activeLeadIdRef = useRef(leadId);

  useEffect(() => {
    activeLeadIdRef.current = leadId;
    const timeout = window.setTimeout(() => {
      setVisits([]);
      setMeta({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
      setPage(1);
      setError("");
      setIsLoading(false);
      setDetail(null);
      setIsDetailOpen(false);
      setIsDetailLoading(false);
      setDetailError("");
      setIsRecordOpen(false);
      setForm(emptyVisitForm);
      setFormError("");
      setIsRecording(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [leadId]);

  const loadVisits = useCallback(async (currentLeadId: string) => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await listLeadVisits(token, currentLeadId, { limit: pageSize, page });
      if (activeLeadIdRef.current !== currentLeadId) return;
      setVisits(result.data);
      setMeta(result.meta);
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setVisits([]);
      setMeta({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
      setError(apiError instanceof Error ? apiError.message : "Unable to load Lead visits.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsLoading(false);
    }
  }, [handleLeadApiError, page, token]);

  useEffect(() => {
    if (activeTab !== "visits" || !leadId) return;
    const timeout = window.setTimeout(() => {
      void loadVisits(leadId);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [activeTab, leadId, loadVisits]);

  async function openDetail(visitId: string) {
    if (!token || !leadId) return;
    const currentLeadId = leadId;
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setDetail(null);
    setDetailError("");
    try {
      const visitDetail = await getLeadVisitDetail(token, currentLeadId, visitId);
      if (activeLeadIdRef.current !== currentLeadId) return;
      setDetail(visitDetail);
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setDetailError(apiError instanceof Error ? apiError.message : "Unable to load Visit detail.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsDetailLoading(false);
    }
  }

  function openRecordDialog() {
    setForm(emptyVisitForm);
    setFormError("");
    setIsRecordOpen(true);
  }

  function closeRecordDialog() {
    if (isRecording) return;
    setIsRecordOpen(false);
    setForm(emptyVisitForm);
    setFormError("");
  }

  async function submitVisit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !lead || isRecording) return;
    const currentLeadId = lead.id;

    setIsRecording(true);
    setFormError("");
    try {
      const payload = buildVisitPayload(form, activePrograms);
      await recordLeadVisit(token, currentLeadId, payload);
      if (activeLeadIdRef.current !== currentLeadId) return;
      setNotice("Lead visit recorded.");
      setIsRecordOpen(false);
      setForm(emptyVisitForm);
      await Promise.all([
        refreshLeadProfile(currentLeadId),
        refreshTimeline(currentLeadId),
        loadVisits(currentLeadId),
      ]);
      navigateToTab("visits");
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setFormError(apiError instanceof Error ? apiError.message : "Unable to record Lead visit.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsRecording(false);
    }
  }

  return {
    detail,
    detailError,
    error,
    form,
    formError,
    isDetailLoading,
    isDetailOpen,
    isLoading,
    isRecordOpen,
    isRecording,
    meta,
    visits,
    actions: {
      closeRecordDialog,
      loadVisits,
      openDetail,
      openRecordDialog,
      setDetail,
      setDetailError,
      setForm,
      setFormError,
      setIsDetailOpen,
      setPage,
      submitVisit,
    },
  };
}
