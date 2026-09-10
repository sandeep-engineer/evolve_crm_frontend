"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type AuthUser } from "@/lib/api/auth";
import { getBatches, type Batch } from "@/lib/api/batches";
import { getBranches, type Branch } from "@/lib/api/branches";
import { getGoals, type Goal } from "@/lib/api/goals";
import { createLeadForBranch, LeadApiError, LeadPhoneConflictError, listLeads, type LeadSummary, type PaginationMeta } from "@/lib/api/leads";
import { getOrganizations, type Organization } from "@/lib/api/organizations";
import { getPrograms, type Program } from "@/lib/api/programs";
import { clearSession, getAccessToken, getStoredUser, saveSession } from "@/lib/session";
import { emptyForm } from "@/features/leads/constants";
import type { LeadFormState } from "@/features/leads/types";
import { buildCreatePayload } from "@/features/leads/utils/lead-payloads";
import { emptyFilters, type MyleadFilters } from "../types";

const PAGE_SIZE = 20;

export function useMyleadWorkspace() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<MyleadFilters>(emptyFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [isScopeLoading, setIsScopeLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<LeadFormState>(emptyForm);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState<LeadPhoneConflictError | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const listRequest = useRef(0);

  const canUseLeads = Boolean(user && user.role !== "LEAD_CALLER");
  const effectiveOrganizationId = user?.role === "CRM_OWNER" ? organizationId : user?.organizationId ?? "";
  const effectiveBranchId = user?.role === "BRANCH_ADMIN" || user?.role === "RECEPTIONIST" ? user.branchId ?? "" : branchId;
  const activePrograms = useMemo(() => programs.filter((item) => item.isActive), [programs]);
  const activeGoals = useMemo(() => goals.filter((item) => item.isActive), [goals]);
  const branchBatches = useMemo(() => batches.filter((item) => item.status === "ACTIVE" && (!item.branchId || item.branchId === effectiveBranchId)), [batches, effectiveBranchId]);
  const canRequest = Boolean(canUseLeads && effectiveOrganizationId && effectiveBranchId);

  const handleError = useCallback((apiError: unknown, fallback: string) => {
    if (apiError instanceof LeadApiError && apiError.status === 401) {
      clearSession();
      router.replace("/");
      return "";
    }
    return apiError instanceof Error ? apiError.message : fallback;
  }, [router]);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) return void router.replace("/");
    let active = true;
    const timeout = window.setTimeout(() => {
      setToken(accessToken);
      setUser(getStoredUser());
      void getCurrentUser(accessToken).then((current) => {
        if (!active) return;
        setUser(current);
        saveSession(accessToken, current);
      }).catch((apiError) => {
        if (active) setError(handleError(apiError, "Unable to load your account."));
      });
    }, 0);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [handleError, router]);

  useEffect(() => {
    if (!token || !user || user.role === "LEAD_CALLER") return;
    let active = true;
    async function loadScope() {
      setIsScopeLoading(true);
      try {
        if (user!.role === "CRM_OWNER") {
          const result = await getOrganizations(token, { limit: 100, status: "ACTIVE" });
          if (!active) return;
          setOrganizations(result.data);
          setOrganizationId((current) => current || (result.data.length === 1 ? result.data[0].id : ""));
        } else if (user!.role === "ORGANIZATION_OWNER" && user!.organizationId) {
          const result = await getBranches(token, { limit: 100, organizationId: user!.organizationId, status: "ACTIVE" });
          if (!active) return;
          setBranches(result);
          setBranchId((current) => current || (result.length === 1 ? result[0].id : ""));
        }
      } catch (apiError) {
        if (active) setError(handleError(apiError, "Unable to load Lead scope."));
      } finally {
        if (active) setIsScopeLoading(false);
      }
    }
    const timeout = window.setTimeout(() => void loadScope(), 0);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [handleError, token, user]);

  useEffect(() => {
    if (!token || user?.role !== "CRM_OWNER") return;
    let active = true;
    const timeout = window.setTimeout(() => {
      setBranchId("");
      setBranches([]);
      if (!organizationId) return;
      setIsScopeLoading(true);
      void getBranches(token, { limit: 100, organizationId, status: "ACTIVE" }).then((result) => {
        if (!active) return;
        setBranches(result);
        if (result.length === 1) setBranchId(result[0].id);
      }).catch((apiError) => active && setError(handleError(apiError, "Unable to load Branches."))).finally(() => active && setIsScopeLoading(false));
    }, 0);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [handleError, organizationId, token, user?.role]);

  useEffect(() => {
    if (!token || !canRequest) return;
    let active = true;
    void Promise.all([getPrograms(token), getGoals(token), getBatches(token)]).then(([nextPrograms, nextGoals, nextBatches]) => {
      if (!active) return;
      setPrograms(nextPrograms); setGoals(nextGoals); setBatches(nextBatches);
    }).catch((apiError) => active && setError(handleError(apiError, "Unable to load Lead form options.")));
    return () => { active = false; };
  }, [canRequest, handleError, token]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadLeads = useCallback(async () => {
    const requestId = ++listRequest.current;
    if (!token || !user || !canRequest) {
      setLeads([]); setMeta({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }); return;
    }
    setIsLoading(true); setError("");
    try {
      const result = await listLeads(token, {
        branchId: effectiveBranchId,
        organizationId: user.role === "CRM_OWNER" ? effectiveOrganizationId : undefined,
        page, limit: PAGE_SIZE, search: debouncedSearch || undefined,
        source: filters.source || undefined, stage: filters.stage || undefined, status: filters.status || undefined,
        programId: filters.programId || undefined,
        createdFrom: filters.createdFrom ? `${filters.createdFrom}T00:00:00.000Z` : undefined,
        createdTo: filters.createdTo ? `${filters.createdTo}T23:59:59.999Z` : undefined,
      });
      if (listRequest.current !== requestId) return;
      setLeads(result.data); setMeta(result.meta);
    } catch (apiError) {
      if (listRequest.current !== requestId) return;
      setError(handleError(apiError, "Unable to load Leads.")); setLeads([]);
    } finally {
      if (listRequest.current === requestId) setIsLoading(false);
    }
  }, [canRequest, debouncedSearch, effectiveBranchId, effectiveOrganizationId, filters, handleError, page, token, user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadLeads(), 0);
    return () => { window.clearTimeout(timeout); listRequest.current += 1; };
  }, [loadLeads]);

  async function createLead() {
    if (!token || !effectiveBranchId || isSaving) return;
    setIsSaving(true); setFormError(""); setConflict(null);
    try {
      const payload = buildCreatePayload(form, branchBatches, activePrograms, activeGoals, []);
      await createLeadForBranch(token, effectiveBranchId, payload);
      setNotice("Lead created successfully."); setIsCreateOpen(false); setForm(emptyForm);
      await loadLeads();
    } catch (apiError) {
      if (apiError instanceof LeadPhoneConflictError) setConflict(apiError);
      else setFormError(handleError(apiError, "Unable to create Lead."));
    } finally { setIsSaving(false); }
  }

  return {
    token, user, organizations, branches, organizationId, branchId, effectiveBranchId,
    activePrograms, activeGoals, branchBatches, leads, meta, page, search, filters,
    isLoading, isScopeLoading, isCreateOpen, isSaving, form, error, formError, notice,
    conflict, selectedLeadId, canRequest, canUseLeads, handleError,
    actions: {
      setOrganizationId: (value: string) => { setPage(1); setOrganizationId(value); },
      setBranchId: (value: string) => { setPage(1); setBranchId(value); },
      setPage,
      setSearch: (value: string) => { setPage(1); setSearch(value); },
      setFilters: (value: MyleadFilters) => { setPage(1); setFilters(value); },
      setForm,
      setSelectedLeadId, setIsCreateOpen, setError, setFormError, setNotice,
      resetFilters: () => { setPage(1); setSearch(""); setFilters(emptyFilters); },
      openCreate: () => { setForm(emptyForm); setConflict(null); setFormError(""); setIsCreateOpen(true); },
      locateConflict: () => { setSearch(conflict?.existingLead?.primaryPhone || conflict?.existingLead?.fullName || form.primaryPhone); setIsCreateOpen(false); },
      createLead, loadLeads,
    },
  };
}
