import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getLeadContactDetail,
  listLeadContacts,
  recordLeadContact,
  type LeadAssigneeOption,
  type LeadCommunicationChannel,
  type LeadContactDetail,
  type LeadContactOutcome,
  type LeadContactSummary,
  type LeadDetail,
  type PaginationMeta,
} from "@/lib/api/leads";
import { emptyContactForm, pageSize } from "../constants";
import type { ContactFormState, LeadProfileTab } from "../types";
import { buildContactPayload, defaultContactForm } from "../utils/lead-payloads";
import type { HandleLeadApiError } from "./lead-controller-types";

type LeadContactsControllerParams = {
  activeTab: LeadProfileTab;
  handleLeadApiError: HandleLeadApiError;
  lead: LeadDetail | null;
  leadId: string;
  navigateToTab: (tab: LeadProfileTab) => void;
  profileAssignees: LeadAssigneeOption[];
  refreshLeadProfile: (leadId: string) => Promise<LeadDetail | null>;
  refreshTimeline: (leadId: string) => Promise<void>;
  setNotice: (message: string) => void;
  token: string;
};

export function useLeadContactsController({
  activeTab,
  handleLeadApiError,
  lead,
  leadId,
  navigateToTab,
  profileAssignees,
  refreshLeadProfile,
  refreshTimeline,
  setNotice,
  token,
}: LeadContactsControllerParams) {
  const [contacts, setContacts] = useState<LeadContactSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState<LeadCommunicationChannel | "">("");
  const [outcomeFilter, setOutcomeFilter] = useState<LeadContactOutcome | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<LeadContactDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [form, setForm] = useState<ContactFormState>(emptyContactForm);
  const [formError, setFormError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const activeLeadIdRef = useRef(leadId);

  useEffect(() => {
    activeLeadIdRef.current = leadId;
    const timeout = window.setTimeout(() => {
      setContacts([]);
      setMeta({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
      setPage(1);
      setChannelFilter("");
      setOutcomeFilter("");
      setIsLoading(false);
      setError("");
      setDetail(null);
      setIsDetailOpen(false);
      setIsDetailLoading(false);
      setDetailError("");
      setIsRecordOpen(false);
      setForm(emptyContactForm);
      setFormError("");
      setIsRecording(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [leadId]);

  const loadContacts = useCallback(async (currentLeadId: string) => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await listLeadContacts(token, currentLeadId, {
        channel: channelFilter || undefined,
        limit: pageSize,
        outcome: outcomeFilter || undefined,
        page,
      });
      if (activeLeadIdRef.current !== currentLeadId) return;
      setContacts(result.data);
      setMeta(result.meta);
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setContacts([]);
      setMeta({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
      setError(apiError instanceof Error ? apiError.message : "Unable to load Lead contact history.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsLoading(false);
    }
  }, [channelFilter, handleLeadApiError, outcomeFilter, page, token]);

  useEffect(() => {
    if (activeTab !== "contacts" || !leadId) return;
    const timeout = window.setTimeout(() => {
      void loadContacts(leadId);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [activeTab, leadId, loadContacts]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [channelFilter, outcomeFilter]);

  async function openDetail(contactId: string) {
    if (!token || !leadId) return;
    const currentLeadId = leadId;
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setDetail(null);
    setDetailError("");
    try {
      const contactDetail = await getLeadContactDetail(token, currentLeadId, contactId);
      if (activeLeadIdRef.current !== currentLeadId) return;
      setDetail(contactDetail);
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setDetailError(apiError instanceof Error ? apiError.message : "Unable to load Contact detail.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsDetailLoading(false);
    }
  }

  function openRecordDialog() {
    setForm(defaultContactForm(lead?.preferredChannel ?? null));
    setFormError("");
    setIsRecordOpen(true);
  }

  function closeRecordDialog() {
    if (isRecording) return;
    setIsRecordOpen(false);
    setForm(emptyContactForm);
    setFormError("");
  }

  async function submitContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !lead || isRecording) return;
    const currentLeadId = lead.id;

    setIsRecording(true);
    setFormError("");
    try {
      const payload = buildContactPayload(form, profileAssignees);
      await recordLeadContact(token, currentLeadId, payload);
      if (activeLeadIdRef.current !== currentLeadId) return;
      setNotice("Contact recorded.");
      setIsRecordOpen(false);
      setForm(emptyContactForm);
      await Promise.all([
        refreshLeadProfile(currentLeadId),
        refreshTimeline(currentLeadId),
        loadContacts(currentLeadId),
      ]);
      navigateToTab("contacts");
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setFormError(apiError instanceof Error ? apiError.message : "Unable to record Contact.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsRecording(false);
    }
  }

  return {
    channelFilter,
    contacts,
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
    outcomeFilter,
    actions: {
      closeRecordDialog,
      loadContacts,
      openDetail,
      openRecordDialog,
      setChannelFilter,
      setDetail,
      setDetailError,
      setForm,
      setFormError,
      setIsDetailOpen,
      setOutcomeFilter,
      setPage,
      submitContact,
    },
  };
}
