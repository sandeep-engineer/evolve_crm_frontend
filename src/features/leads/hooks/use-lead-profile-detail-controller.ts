import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBatches, type Batch } from "@/lib/api/batches";
import { getGoals, type Goal } from "@/lib/api/goals";
import {
  getLeadDetail,
  LeadPhoneConflictError,
  listLeadAssignees,
  updateLeadAssignment,
  updateLeadProfile,
  type LeadAssigneeOption,
  type LeadDetail,
  type PaginationMeta,
} from "@/lib/api/leads";
import { getPrograms, type Program } from "@/lib/api/programs";
import { emptyForm, pageSize } from "../constants";
import type { LeadFormState } from "../types";
import { buildUpdatePayload, leadToForm } from "../utils/lead-payloads";
import type { HandleLeadApiError } from "./lead-controller-types";

type LeadProfileDetailControllerParams = {
  handleLeadApiError: HandleLeadApiError;
  leadId: string;
  setNotice: (message: string) => void;
  token: string;
  canUseLeads: boolean;
};

export function useLeadProfileDetailController({
  handleLeadApiError,
  leadId,
  setNotice,
  token,
  canUseLeads,
}: LeadProfileDetailControllerParams) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [metadataWarning, setMetadataWarning] = useState("");
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileStatus, setProfileStatus] = useState<number | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editForm, setEditForm] = useState<LeadFormState>(emptyForm);
  const [editConflict, setEditConflict] = useState<LeadPhoneConflictError | null>(null);
  const [assignmentValue, setAssignmentValue] = useState("");
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignees, setAssignees] = useState<LeadAssigneeOption[]>([]);
  const [assigneeMeta, setAssigneeMeta] = useState<PaginationMeta>({
    limit: pageSize,
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [assigneePage, setAssigneePage] = useState(1);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [debouncedAssigneeSearch, setDebouncedAssigneeSearch] = useState("");
  const [isAssigneesLoading, setIsAssigneesLoading] = useState(false);
  const [assigneeError, setAssigneeError] = useState("");
  const activeLeadIdRef = useRef(leadId);
  const profileRequestRef = useRef(0);

  const activePrograms = useMemo(
    () => programs.filter((program) => program.isActive),
    [programs],
  );
  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.isActive),
    [goals],
  );
  const branchBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          batch.status === "ACTIVE" &&
          (!batch.branchId || batch.branchId === lead?.branchId),
      ),
    [batches, lead?.branchId],
  );

  useEffect(() => {
    activeLeadIdRef.current = leadId;
    const timeout = window.setTimeout(() => {
      setLead(null);
      setProfileError("");
      setProfileStatus(null);
      setEditConflict(null);
      setAssignmentError("");
      setIsEditingProfile(false);
      setAssignees([]);
      setAssigneeSearch("");
      setAssigneePage(1);
    }, 0);

    return () => {
      activeLeadIdRef.current = "";
      window.clearTimeout(timeout);
    };
  }, [leadId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedAssigneeSearch(assigneeSearch.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [assigneeSearch]);

  const loadMetadata = useCallback(async () => {
    if (!token || !canUseLeads) return;
    setMetadataWarning("");

    try {
      const [programData, goalData, batchData] = await Promise.all([
        getPrograms(token),
        getGoals(token),
        getBatches(token),
      ]);
      if (activeLeadIdRef.current !== leadId) return;
      setPrograms(programData);
      setGoals(goalData);
      setBatches(batchData);
    } catch (apiError) {
      if (activeLeadIdRef.current !== leadId) return;
      if (handleLeadApiError(apiError)) return;
      setMetadataWarning(apiError instanceof Error ? apiError.message : "Unable to load Lead metadata.");
    }
  }, [canUseLeads, handleLeadApiError, leadId, token]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadMetadata();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadMetadata]);

  const refreshLeadProfile = useCallback(async (currentLeadId: string) => {
    if (!token) return null;
    const requestId = ++profileRequestRef.current;
    setIsProfileLoading(true);
    setProfileError("");
    setProfileStatus(null);
    try {
      const detail = await getLeadDetail(token, currentLeadId);
      if (activeLeadIdRef.current !== currentLeadId || profileRequestRef.current !== requestId) return null;
      setLead(detail);
      setEditForm(leadToForm(detail));
      setAssignmentValue(detail.assignedUser?.id ?? "");
      return detail;
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return null;
      if (handleLeadApiError(apiError)) return null;
      if (profileRequestRef.current !== requestId) return null;
      setLead(null);
      setProfileError(apiError instanceof Error ? apiError.message : "Unable to load Lead profile.");
      setProfileStatus(typeof apiError === "object" && apiError && "status" in apiError ? Number(apiError.status) : null);
      return null;
    } finally {
      if (activeLeadIdRef.current === currentLeadId && profileRequestRef.current === requestId) setIsProfileLoading(false);
    }
  }, [handleLeadApiError, token]);

  useEffect(() => {
    if (!token || !canUseLeads) return;
    const timeout = window.setTimeout(() => {
      void refreshLeadProfile(leadId);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [canUseLeads, leadId, refreshLeadProfile, token]);

  useEffect(() => {
    if (!token || !lead?.branchId) return;
    let isMounted = true;

    async function loadProfileAssignees() {
      setIsAssigneesLoading(true);
      setAssigneeError("");
      try {
        const result = await listLeadAssignees(token, lead!.branchId, {
          page: assigneePage,
          limit: pageSize,
          search: debouncedAssigneeSearch || undefined,
        });
        if (!isMounted) return;
        setAssignees(result.data);
        setAssigneeMeta(result.meta);
      } catch (apiError) {
        if (!isMounted) return;
        if (handleLeadApiError(apiError)) return;
        setAssignees([]);
        setAssigneeMeta({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
        setAssigneeError(apiError instanceof Error ? apiError.message : "Unable to load assignees.");
      } finally {
        if (isMounted) setIsAssigneesLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadProfileAssignees();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [assigneePage, debouncedAssigneeSearch, handleLeadApiError, lead, token]);

  async function submitProfileUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !lead) return;
    const currentLeadId = lead.id;

    setIsUpdatingProfile(true);
    setProfileError("");
    setEditConflict(null);
    try {
      const payload = buildUpdatePayload(editForm, branchBatches, activePrograms, activeGoals);
      const updated = await updateLeadProfile(token, lead.id, payload);
      if (activeLeadIdRef.current !== currentLeadId) return;
      setLead(updated);
      setEditForm(leadToForm(updated));
      setNotice("Lead profile updated.");
      setIsEditingProfile(false);
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (apiError instanceof LeadPhoneConflictError) {
        setEditConflict(apiError);
      } else if (!handleLeadApiError(apiError)) {
        setProfileError(apiError instanceof Error ? apiError.message : "Unable to update Lead profile.");
      }
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsUpdatingProfile(false);
    }
  }

  async function submitAssignmentChange(nextAssignedUserId: string | null) {
    if (!token || !lead) return;
    const currentLeadId = lead.id;

    const currentAssignedUserId = lead.assignedUser?.id ?? null;
    if (currentAssignedUserId === nextAssignedUserId) return;
    if (nextAssignedUserId && !assignees.some((assignee) => assignee.userId === nextAssignedUserId)) {
      setAssignmentError("Choose an eligible assignee from the scoped Branch list.");
      return;
    }
    const confirmed = window.confirm(
      nextAssignedUserId ? "Update this Lead assignment?" : "Remove the current Lead assignment?",
    );
    if (!confirmed) return;

    setIsUpdatingAssignment(true);
    setAssignmentError("");
    try {
      const updated = await updateLeadAssignment(token, lead.id, { assignedUserId: nextAssignedUserId });
      if (activeLeadIdRef.current !== currentLeadId) return;
      setLead(updated);
      setEditForm(leadToForm(updated));
      setAssignmentValue(updated.assignedUser?.id ?? "");
      setNotice(nextAssignedUserId ? "Lead assignment updated." : "Lead assignment removed.");
    } catch (apiError) {
      if (activeLeadIdRef.current !== currentLeadId) return;
      if (handleLeadApiError(apiError)) return;
      setAssignmentError(apiError instanceof Error ? apiError.message : "Unable to update Lead assignment.");
      void refreshLeadProfile(lead.id);
    } finally {
      if (activeLeadIdRef.current === currentLeadId) setIsUpdatingAssignment(false);
    }
  }

  function cancelProfileEdit() {
    if (lead) setEditForm(leadToForm(lead));
    setIsEditingProfile(false);
    setEditConflict(null);
    setProfileError("");
  }

  return {
    activeGoals,
    activePrograms,
    assigneeError,
    assigneeMeta,
    assigneePage,
    assigneeSearch,
    assignees,
    assignmentError,
    assignmentValue,
    branchBatches,
    editConflict,
    editForm,
    isAssigneesLoading,
    isEditingProfile,
    isProfileLoading,
    isUpdatingAssignment,
    isUpdatingProfile,
    lead,
    metadataWarning,
    profileError,
    profileStatus,
    actions: {
      cancelProfileEdit,
      dismissMetadataWarning: () => setMetadataWarning(""),
      refreshLeadProfile,
      setAssigneePage,
      setAssigneeSearch: (value: string) => {
        setAssigneeSearch(value);
        setAssigneePage(1);
      },
      setAssignmentValue,
      setEditForm,
      setIsEditingProfile,
      submitAssignmentChange,
      submitProfileUpdate,
    },
  };
}
