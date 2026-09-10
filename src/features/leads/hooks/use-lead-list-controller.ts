import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthApiError, getCurrentUser, type AuthUser } from "@/lib/api/auth";
import { getBatches, type Batch } from "@/lib/api/batches";
import { getBranches, type Branch } from "@/lib/api/branches";
import { getGoals, type Goal } from "@/lib/api/goals";
import {
  createLeadForBranch,
  LeadApiError,
  LeadPhoneConflictError,
  listLeadAssignees,
  listLeads,
  type LeadAssigneeOption,
  type LeadSummary,
  type PaginationMeta,
} from "@/lib/api/leads";
import { getOrganizations, type Organization } from "@/lib/api/organizations";
import { getPrograms, type Program } from "@/lib/api/programs";
import { clearSession, getAccessToken, getStoredUser, saveSession } from "@/lib/session";
import { emptyFilters, emptyForm, pageSize } from "../constants";
import { leadProfilePath } from "../lead-routes";
import type { FilterState, LeadFormState } from "../types";
import { dateFilterValue } from "../utils/lead-formatters";
import { buildCreatePayload } from "../utils/lead-payloads";

export function useLeadListController() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [assignees, setAssignees] = useState<LeadAssigneeOption[]>([]);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    limit: pageSize,
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [isScopeLoading, setIsScopeLoading] = useState(true);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [metadataWarning, setMetadataWarning] = useState("");
  const [formError, setFormError] = useState("");
  const [phoneConflict, setPhoneConflict] = useState<LeadPhoneConflictError | null>(null);
  const [form, setForm] = useState<LeadFormState>(emptyForm);

  const canUseLeads = Boolean(user && user.role !== "LEAD_CALLER");
  const fixedBranchId =
    user?.role === "BRANCH_ADMIN" || user?.role === "RECEPTIONIST"
      ? user.branchId ?? ""
      : "";
  const effectiveOrganizationId =
    user?.role === "CRM_OWNER"
      ? selectedOrganizationId
      : user?.organizationId ?? "";
  const effectiveBranchId = fixedBranchId || selectedBranchId;
  const selectedOrganization = organizations.find(
    (organization) => organization.id === selectedOrganizationId,
  );
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);
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
          (!batch.branchId || batch.branchId === effectiveBranchId),
      ),
    [batches, effectiveBranchId],
  );
  const canRequestLeads = Boolean(canUseLeads && effectiveBranchId && effectiveOrganizationId);

  useEffect(() => {
    const accessToken = getAccessToken();
    const storedUser = getStoredUser();
    if (!accessToken) {
      router.replace("/");
      return;
    }

    const currentToken = accessToken;
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const currentUser = await getCurrentUser(currentToken);
        if (!isMounted) return;
        setUser(currentUser);
        saveSession(currentToken, currentUser);
      } catch (apiError) {
        if (apiError instanceof AuthApiError && apiError.status === 401) {
          clearSession();
          router.replace("/");
          return;
        }
        if (isMounted) setError("Unable to load your profile.");
      }
    }

    const timeout = window.setTimeout(() => {
      if (!isMounted) return;
      setToken(currentToken);
      setUser(storedUser);
      void loadCurrentUser();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("search");
      if (query) setSearch(query);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [debouncedSearch, effectiveBranchId, filters]);

  useEffect(() => {
    if (!token || !user) return;
    const currentUser = user;
    let isMounted = true;

    async function loadScope() {
      if (currentUser.role === "LEAD_CALLER") {
        setIsScopeLoading(false);
        return;
      }

      setIsScopeLoading(true);
      setError("");
      try {
        if (currentUser.role === "CRM_OWNER") {
          const result = await getOrganizations(token, { limit: 100, status: "ACTIVE" });
          if (!isMounted) return;
          setOrganizations(result.data);
          if (!selectedOrganizationId && result.data.length === 1) {
            setSelectedOrganizationId(result.data[0].id);
          }
          return;
        }

        const organizationId = currentUser.organizationId;
        if (!organizationId) {
          setError("Your account is missing an Organization scope.");
          return;
        }
        setSelectedOrganizationId(organizationId);

        if (currentUser.role === "ORGANIZATION_OWNER") {
          const scopedBranches = await getBranches(token, {
            limit: 100,
            organizationId,
            status: "ACTIVE",
          });
          if (!isMounted) return;
          setBranches(scopedBranches);
          if (!selectedBranchId && scopedBranches.length === 1) {
            setSelectedBranchId(scopedBranches[0].id);
          }
          return;
        }

        if (!currentUser.branchId) setError("Your account is missing a Branch scope.");
      } catch (apiError) {
        if (!isMounted) return;
        setError(apiError instanceof Error ? apiError.message : "Unable to load Lead scope.");
      } finally {
        if (isMounted) setIsScopeLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadScope();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [selectedBranchId, selectedOrganizationId, token, user]);

  useEffect(() => {
    if (!token || !user || user.role !== "CRM_OWNER") return;
    const organizationId = selectedOrganizationId;
    let isMounted = true;

    const timeout = window.setTimeout(() => {
      setBranches([]);
      setSelectedBranchId("");
      if (!organizationId) {
        setIsScopeLoading(false);
        return;
      }
      void loadBranchesForOrganization();
    }, 0);

    async function loadBranchesForOrganization() {
      setIsScopeLoading(true);
      try {
        const scopedBranches = await getBranches(token, {
          limit: 100,
          organizationId,
          status: "ACTIVE",
        });
        if (!isMounted) return;
        setBranches(scopedBranches);
        if (scopedBranches.length === 1) setSelectedBranchId(scopedBranches[0].id);
      } catch (apiError) {
        if (isMounted) setError(apiError instanceof Error ? apiError.message : "Unable to load Branches.");
      } finally {
        if (isMounted) setIsScopeLoading(false);
      }
    }

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [selectedOrganizationId, token, user]);

  const loadMetadata = useCallback(async () => {
    if (!token || !user || !canUseLeads || !effectiveBranchId) return;
    setIsMetadataLoading(true);
    setMetadataWarning("");

    try {
      const [programData, goalData, batchData] = await Promise.all([
        getPrograms(token),
        getGoals(token),
        getBatches(token),
      ]);
      setPrograms(programData);
      setGoals(goalData);
      setBatches(batchData);
      const options = await listLeadAssignees(token, effectiveBranchId, { limit: 100 });
      setAssignees(options.data);
    } catch (apiError) {
      setAssignees([]);
      if (apiError instanceof LeadApiError && apiError.status === 401) {
        clearSession();
        router.replace("/");
        return;
      }
      setMetadataWarning(apiError instanceof Error ? apiError.message : "Unable to load Lead metadata.");
    } finally {
      setIsMetadataLoading(false);
    }
  }, [canUseLeads, effectiveBranchId, router, token, user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadMetadata();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadMetadata]);

  const loadLeadList = useCallback(async () => {
    if (!token || !user || !canRequestLeads) {
      setLeads([]);
      setMeta({ limit: pageSize, page: 1, total: 0, totalPages: 1 });
      return;
    }

    setIsListLoading(true);
    setError("");
    try {
      const result = await listLeads(token, {
        assignedUserId: filters.assignedUserId || undefined,
        branchId: effectiveBranchId,
        createdFrom: dateFilterValue(filters.createdFrom, "start"),
        createdTo: dateFilterValue(filters.createdTo, "end"),
        followUpFrom: dateFilterValue(filters.followUpFrom, "start"),
        followUpTo: dateFilterValue(filters.followUpTo, "end"),
        organizationId: user.role === "CRM_OWNER" ? effectiveOrganizationId : undefined,
        page,
        limit: pageSize,
        programId: filters.programId || undefined,
        search: debouncedSearch || undefined,
        source: filters.source || undefined,
        stage: filters.stage || undefined,
        status: filters.status || undefined,
      });
      setLeads(result.data);
      setMeta(result.meta);
    } catch (apiError) {
      if (apiError instanceof LeadApiError && apiError.status === 401) {
        clearSession();
        router.replace("/");
        return;
      }
      setError(apiError instanceof Error ? apiError.message : "Unable to load Leads.");
      setLeads([]);
    } finally {
      setIsListLoading(false);
    }
  }, [canRequestLeads, debouncedSearch, effectiveBranchId, effectiveOrganizationId, filters, page, router, token, user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadLeadList();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadLeadList]);

  function resetFilters() {
    setSearch("");
    setFilters(emptyFilters);
  }

  function openCreateDialog() {
    setForm(emptyForm);
    setFormError("");
    setPhoneConflict(null);
    setIsCreateOpen(true);
  }

  function openLeadProfile(leadId: string) {
    router.push(leadProfilePath(leadId));
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !effectiveBranchId) return;

    setIsSaving(true);
    setFormError("");
    setPhoneConflict(null);
    try {
      const payload = buildCreatePayload(form, branchBatches, activePrograms, activeGoals, assignees);
      await createLeadForBranch(token, effectiveBranchId, payload);
      setNotice("Lead created.");
      setIsCreateOpen(false);
      setForm(emptyForm);
      await loadLeadList();
    } catch (apiError) {
      if (apiError instanceof LeadPhoneConflictError) {
        setPhoneConflict(apiError);
        setFormError("");
      } else {
        setFormError(apiError instanceof Error ? apiError.message : "Unable to create Lead.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function locateConflict() {
    const existingLead = phoneConflict?.existingLead;
    setSearch(existingLead?.primaryPhone || existingLead?.fullName || form.primaryPhone);
    setFilters((current) => ({ ...current, stage: "", status: "", source: "" }));
    setIsCreateOpen(false);
  }

  return {
    activeGoals,
    activePrograms,
    assignees,
    branchBatches,
    branches,
    canRequestLeads,
    effectiveBranchId,
    error,
    filters,
    form,
    formError,
    isCreateOpen,
    isListLoading,
    isMetadataLoading,
    isSaving,
    isScopeLoading,
    leads,
    meta,
    metadataWarning,
    notice,
    organizations,
    phoneConflict,
    search,
    selectedBranch,
    selectedBranchId,
    selectedOrganization,
    selectedOrganizationId,
    user,
    actions: {
      dismissError: () => setError(""),
      dismissFormError: () => setFormError(""),
      dismissMetadataWarning: () => setMetadataWarning(""),
      dismissNotice: () => setNotice(""),
      locateConflict,
      openCreateDialog,
      openLeadProfile,
      refreshList: loadLeadList,
      resetFilters,
      setFilters,
      setForm,
      setIsCreateOpen,
      setPage,
      setSearch,
      setSelectedBranchId,
      setSelectedOrganizationId,
      submitLead,
    },
  };
}
