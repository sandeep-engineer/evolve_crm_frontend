import { useCallback, useEffect, useRef, useState } from "react";
import {
  getLeadTimeline,
  type LeadTimelineEvent,
  type LeadTimelineEventType,
  type PaginationMeta,
} from "@/lib/api/leads";
import { pageSize } from "../constants";
import type { LeadProfileTab } from "../types";
import type { HandleLeadApiError } from "./lead-controller-types";

type LeadTimelineControllerParams = {
  activeTab: LeadProfileTab;
  handleLeadApiError: HandleLeadApiError;
  leadId: string;
  token: string;
};

export function useLeadTimelineController({
  activeTab,
  handleLeadApiError,
  leadId,
  token,
}: LeadTimelineControllerParams) {
  const [events, setEvents] = useState<LeadTimelineEvent[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    limit: pageSize,
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState<LeadTimelineEventType | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const activeLeadIdRef = useRef(leadId);
  const listRequestRef = useRef(0);

  useEffect(() => {
    activeLeadIdRef.current = leadId;
    const timeout = window.setTimeout(() => {
      setEvents([]);
      setMeta({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
      setPage(1);
      setEventType("");
      setError("");
      setIsLoading(false);
    }, 0);

    return () => {
      activeLeadIdRef.current = "";
      window.clearTimeout(timeout);
    };
  }, [leadId]);

  const loadTimeline = useCallback(async (currentLeadId: string) => {
    if (!token) return;
    const requestId = ++listRequestRef.current;
    setIsLoading(true);
    setError("");
    try {
      const result = await getLeadTimeline(token, currentLeadId, {
        eventType: eventType || undefined,
        limit: pageSize,
        page,
      });
      if (activeLeadIdRef.current !== currentLeadId || listRequestRef.current !== requestId) return;
      setEvents(result.data);
      setMeta(result.meta);
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      if (listRequestRef.current !== requestId) return;
      setEvents([]);
      setMeta({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
      setError(apiError instanceof Error ? apiError.message : "Unable to load Lead timeline.");
    } finally {
      if (activeLeadIdRef.current === currentLeadId && listRequestRef.current === requestId) setIsLoading(false);
    }
  }, [eventType, handleLeadApiError, page, token]);

  useEffect(() => {
    if (activeTab !== "timeline" || !leadId) return;
    const timeout = window.setTimeout(() => {
      void loadTimeline(leadId);
    }, 0);
    return () => {
      listRequestRef.current += 1;
      window.clearTimeout(timeout);
    };
  }, [activeTab, leadId, loadTimeline]);

  function handleEventTypeChange(value: LeadTimelineEventType | "") {
    setEventType(value);
    setPage(1);
  }

  return {
    error,
    eventType,
    events,
    isLoading,
    meta,
    actions: {
      loadTimeline,
      setEventType: handleEventTypeChange,
      setPage,
    },
  };
}
