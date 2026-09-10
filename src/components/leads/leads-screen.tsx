"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { InitialAvatar } from "@/components/ui/initial-avatar";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthApiError, getCurrentUser, type AuthUser } from "@/lib/api/auth";
import { getBatches, type Batch } from "@/lib/api/batches";
import { getBranches, type Branch } from "@/lib/api/branches";
import { getGoals, type Goal } from "@/lib/api/goals";
import {
  createLeadForBranch,
  getLeadDetail,
  LeadApiError,
  LeadPhoneConflictError,
  listLeadAssignees,
  listLeads,
  updateLeadAssignment,
  updateLeadProfile,
  type BatchTypePref,
  type CreateLeadRequest,
  type LeadAssigneeOption,
  type LeadCommunicationChannel,
  type LeadCurrentIntent,
  type LeadDetail,
  type LeadSource,
  type LeadStage,
  type LeadStatus,
  type LeadSummary,
  type PaginationMeta,
  type UpdateLeadRequest,
} from "@/lib/api/leads";
import { getOrganizations, type Organization } from "@/lib/api/organizations";
import { getPrograms, type Program } from "@/lib/api/programs";
import { clearSession, getAccessToken, getStoredUser, saveSession } from "@/lib/session";
import { cn } from "@/lib/utils";

type LeadFormState = {
  alternatePhone: string;
  assignedUserId: string;
  batchTypePref: BatchTypePref | "";
  currentIntent: LeadCurrentIntent;
  currentSummary: string;
  dob: string;
  email: string;
  fullName: string;
  goalIds: string[];
  preferredBatchId: string;
  preferredChannel: LeadCommunicationChannel | "";
  preferredDays: number[];
  preferredEndTime: string;
  preferredStartTime: string;
  primaryPhone: string;
  programIds: string[];
  source: LeadSource;
  sourceDetails: string;
};

type FilterState = {
  assignedUserId: string;
  createdFrom: string;
  createdTo: string;
  followUpFrom: string;
  followUpTo: string;
  programId: string;
  source: LeadSource | "";
  stage: LeadStage | "";
  status: LeadStatus | "";
};

const emptyForm: LeadFormState = {
  alternatePhone: "",
  assignedUserId: "",
  batchTypePref: "",
  currentIntent: "UNDECIDED",
  currentSummary: "",
  dob: "",
  email: "",
  fullName: "",
  goalIds: [],
  preferredBatchId: "",
  preferredChannel: "",
  preferredDays: [],
  preferredEndTime: "",
  preferredStartTime: "",
  primaryPhone: "",
  programIds: [],
  source: "WHATSAPP_INQUIRY",
  sourceDetails: "",
};

const emptyFilters: FilterState = {
  assignedUserId: "",
  createdFrom: "",
  createdTo: "",
  followUpFrom: "",
  followUpTo: "",
  programId: "",
  source: "",
  stage: "",
  status: "",
};

const leadSources: Array<{ label: string; value: LeadSource }> = [
  { label: "WhatsApp inquiry", value: "WHATSAPP_INQUIRY" },
  { label: "Walk-in", value: "WALK_IN" },
  { label: "Referral", value: "REFERRAL" },
  { label: "Instagram ads", value: "INSTAGRAM_ADS" },
  { label: "Facebook ads", value: "FACEBOOK_ADS" },
  { label: "Google ads", value: "GOOGLE_ADS" },
  { label: "Website", value: "WEBSITE" },
  { label: "Other", value: "OTHER" },
];

const leadStages: Array<{ label: string; value: LeadStage }> = [
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Visit scheduled", value: "VISIT_SCHEDULED" },
  { label: "Visited", value: "VISITED" },
  { label: "Trial requested", value: "TRIAL_REQUESTED" },
  { label: "Trial scheduled", value: "TRIAL_SCHEDULED" },
  { label: "Trial completed", value: "TRIAL_COMPLETED" },
  { label: "Ready to join", value: "READY_TO_JOIN" },
  { label: "Converted", value: "CONVERTED" },
  { label: "Lost", value: "LOST" },
];

const leadStatuses: Array<{ label: string; value: LeadStatus }> = [
  { label: "Active", value: "ACTIVE" },
  { label: "Follow-up", value: "FOLLOW_UP" },
  { label: "Unreachable", value: "UNREACHABLE" },
  { label: "Dormant", value: "DORMANT" },
  { label: "Archived", value: "ARCHIVED" },
];

const leadIntentOptions: Array<{ label: string; value: LeadCurrentIntent }> = [
  { label: "Undecided", value: "UNDECIDED" },
  { label: "Needs time", value: "NEEDS_TIME" },
  { label: "Trial", value: "TRIAL" },
  { label: "Direct joining", value: "DIRECT_JOINING" },
];

const preferredChannels: Array<{ label: string; value: LeadCommunicationChannel }> = [
  { label: "Phone call", value: "PHONE_CALL" },
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "SMS", value: "SMS" },
  { label: "Email", value: "EMAIL" },
  { label: "In person", value: "IN_PERSON" },
];

const batchTypeOptions: Array<{ label: string; value: BatchTypePref }> = [
  { label: "Group batch", value: "GROUP_BATCH" },
  { label: "Group PT", value: "GROUP_PT" },
  { label: "Personal training", value: "PERSONAL_TRAINING" },
];

const dayOptions = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

const pageSize = 20;

export function LeadsScreen() {
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
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
  const [profileAssignees, setProfileAssignees] = useState<LeadAssigneeOption[]>([]);
  const [profileAssigneeMeta, setProfileAssigneeMeta] = useState<PaginationMeta>({
    limit: pageSize,
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [profileAssigneePage, setProfileAssigneePage] = useState(1);
  const [profileAssigneeSearch, setProfileAssigneeSearch] = useState("");
  const [debouncedProfileAssigneeSearch, setDebouncedProfileAssigneeSearch] = useState("");
  const [isProfileAssigneesLoading, setIsProfileAssigneesLoading] = useState(false);
  const [profileAssigneeError, setProfileAssigneeError] = useState("");

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
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedProfileAssigneeSearch(profileAssigneeSearch.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [profileAssigneeSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [
    debouncedSearch,
    effectiveBranchId,
    filters.assignedUserId,
    filters.createdFrom,
    filters.createdTo,
    filters.followUpFrom,
    filters.followUpTo,
    filters.programId,
    filters.source,
    filters.stage,
    filters.status,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsProfileOpen(false);
      setSelectedLeadId("");
      setSelectedLead(null);
      setProfileError("");
      setProfileStatus(null);
      setProfileAssignees([]);
      setProfileAssigneeSearch("");
      setProfileAssigneePage(1);
      setAssignmentError("");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [effectiveBranchId, effectiveOrganizationId]);

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

        if (!currentUser.branchId) {
          setError("Your account is missing a Branch scope.");
        }
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
        if (scopedBranches.length === 1) {
          setSelectedBranchId(scopedBranches[0].id);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError instanceof Error ? apiError.message : "Unable to load Branches.");
        }
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
      setMetadataWarning(
        apiError instanceof Error ? apiError.message : "Unable to load Lead metadata.",
      );
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
        organizationId:
          user.role === "CRM_OWNER" ? effectiveOrganizationId : undefined,
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
  }, [
    canRequestLeads,
    debouncedSearch,
    effectiveBranchId,
    effectiveOrganizationId,
    filters.assignedUserId,
    filters.createdFrom,
    filters.createdTo,
    filters.followUpFrom,
    filters.followUpTo,
    filters.programId,
    filters.source,
    filters.stage,
    filters.status,
    page,
    router,
    token,
    user,
  ]);

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

  const refreshLeadProfile = useCallback(async (leadId: string) => {
    if (!token) return null;
    setIsProfileLoading(true);
    setProfileError("");
    setProfileStatus(null);
    try {
      const detail = await getLeadDetail(token, leadId);
      setSelectedLead(detail);
      setEditForm(leadToForm(detail));
      setAssignmentValue(detail.assignedUser?.id ?? "");
      return detail;
    } catch (apiError) {
      if (apiError instanceof LeadApiError) {
        setProfileStatus(apiError.status);
        if (apiError.status === 401) {
          clearSession();
          router.replace("/");
          return null;
        }
      }
      setSelectedLead(null);
      setProfileError(apiError instanceof Error ? apiError.message : "Unable to load Lead profile.");
      return null;
    } finally {
      setIsProfileLoading(false);
    }
  }, [router, token]);

  function openLeadProfile(leadId: string) {
    setSelectedLeadId(leadId);
    setSelectedLead(null);
    setProfileError("");
    setProfileStatus(null);
    setEditConflict(null);
    setAssignmentError("");
    setIsEditingProfile(false);
    setIsProfileOpen(true);
    setProfileAssigneePage(1);
    setProfileAssigneeSearch("");
    void refreshLeadProfile(leadId);
  }

  function closeLeadProfile() {
    setIsProfileOpen(false);
    setSelectedLeadId("");
    setSelectedLead(null);
    setIsEditingProfile(false);
    setProfileError("");
    setProfileStatus(null);
    setAssignmentError("");
    setEditConflict(null);
  }

  useEffect(() => {
    if (!isProfileOpen || !token || !selectedLead?.branchId) return;
    let isMounted = true;

    async function loadProfileAssignees() {
      setIsProfileAssigneesLoading(true);
      setProfileAssigneeError("");
      try {
        const result = await listLeadAssignees(token, selectedLead!.branchId, {
          page: profileAssigneePage,
          limit: pageSize,
          search: debouncedProfileAssigneeSearch || undefined,
        });
        if (!isMounted) return;
        setProfileAssignees(result.data);
        setProfileAssigneeMeta(result.meta);
      } catch (apiError) {
        if (!isMounted) return;
        if (apiError instanceof LeadApiError && apiError.status === 401) {
          clearSession();
          router.replace("/");
          return;
        }
        setProfileAssignees([]);
        setProfileAssigneeMeta({ limit: pageSize, page: 1, total: 0, totalPages: 0 });
        setProfileAssigneeError(apiError instanceof Error ? apiError.message : "Unable to load assignees.");
      } finally {
        if (isMounted) setIsProfileAssigneesLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadProfileAssignees();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [
    debouncedProfileAssigneeSearch,
    isProfileOpen,
    profileAssigneePage,
    router,
    selectedLead,
    token,
  ]);

  async function submitProfileUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedLead) return;

    setIsUpdatingProfile(true);
    setProfileError("");
    setEditConflict(null);
    try {
      const payload = buildUpdatePayload(editForm, branchBatches, activePrograms, activeGoals);
      const updated = await updateLeadProfile(token, selectedLead.id, payload);
      setSelectedLead(updated);
      setEditForm(leadToForm(updated));
      setNotice("Lead profile updated.");
      setIsEditingProfile(false);
      await loadLeadList();
    } catch (apiError) {
      if (apiError instanceof LeadPhoneConflictError) {
        setEditConflict(apiError);
      } else if (apiError instanceof LeadApiError && apiError.status === 401) {
        clearSession();
        router.replace("/");
      } else {
        setProfileError(apiError instanceof Error ? apiError.message : "Unable to update Lead profile.");
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function submitAssignmentChange(nextAssignedUserId: string | null) {
    if (!token || !selectedLead) return;

    const currentAssignedUserId = selectedLead.assignedUser?.id ?? null;
    if (currentAssignedUserId === nextAssignedUserId) return;
    if (nextAssignedUserId && !profileAssignees.some((assignee) => assignee.userId === nextAssignedUserId)) {
      setAssignmentError("Choose an eligible assignee from the scoped Branch list.");
      return;
    }
    const confirmed = window.confirm(
      nextAssignedUserId
        ? "Update this Lead assignment?"
        : "Remove the current Lead assignment?",
    );
    if (!confirmed) return;

    setIsUpdatingAssignment(true);
    setAssignmentError("");
    try {
      const updated = await updateLeadAssignment(token, selectedLead.id, {
        assignedUserId: nextAssignedUserId,
      });
      setSelectedLead(updated);
      setEditForm(leadToForm(updated));
      setAssignmentValue(updated.assignedUser?.id ?? "");
      setNotice(nextAssignedUserId ? "Lead assignment updated." : "Lead assignment removed.");
      await loadLeadList();
    } catch (apiError) {
      if (apiError instanceof LeadApiError && apiError.status === 401) {
        clearSession();
        router.replace("/");
        return;
      }
      setAssignmentError(apiError instanceof Error ? apiError.message : "Unable to update Lead assignment.");
      void refreshLeadProfile(selectedLead.id);
    } finally {
      setIsUpdatingAssignment(false);
    }
  }

  if (user?.role === "LEAD_CALLER") {
    return (
      <AppShell user={user}>
        <Card className="p-[var(--card-padding)]">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 size-[var(--icon-md)] text-[var(--color-danger)]" />
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)]">
                Lead Management is not available
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Your role can work from assigned calling flows, but does not have access to the Lead list.
              </p>
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <div className="space-y-[var(--space-6)]">
        <PageHeader
          title="Leads"
          description="Review scoped Lead records and create new Branch Leads."
          actions={
            <Button
              className="gap-2"
              disabled={!canRequestLeads}
              onClick={openCreateDialog}
            >
              <Plus className="size-[var(--icon-sm)]" />
              New Lead
            </Button>
          }
        />

        <ScopePanel
          branches={branches}
          effectiveBranchId={effectiveBranchId}
          isLoading={isScopeLoading}
          organizations={organizations}
          selectedBranch={selectedBranch}
          selectedBranchId={selectedBranchId}
          selectedOrganization={selectedOrganization}
          selectedOrganizationId={selectedOrganizationId}
          setSelectedBranchId={setSelectedBranchId}
          setSelectedOrganizationId={setSelectedOrganizationId}
          user={user}
        />

        {notice ? (
          <Alert tone="success" onDismiss={() => setNotice("")}>
            {notice}
          </Alert>
        ) : null}
        {error ? (
          <Alert tone="danger" onDismiss={() => setError("")}>
            {error}
          </Alert>
        ) : null}
        {metadataWarning ? (
          <Alert tone="warning" onDismiss={() => setMetadataWarning("")}>
            {metadataWarning}
          </Alert>
        ) : null}

        <Card className="p-[var(--card-padding)]">
          <div className="flex flex-col gap-[var(--space-4)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label className="relative flex min-w-0 flex-1 items-center">
                <Search className="pointer-events-none absolute left-4 size-[var(--icon-sm)] text-[var(--color-text-muted)]" />
                <input
                  className="h-[var(--control-height-lg)] w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-11 pr-4 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, phone, email, summary"
                  type="search"
                  value={search}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterSelect
                  active={Boolean(filters.stage)}
                  icon={Filter}
                  label={filters.stage ? labelFor(leadStages, filters.stage) : "Stage"}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      stage: event.target.value as LeadStage | "",
                    }))
                  }
                  options={[{ label: "All stages", value: "" }, ...leadStages]}
                  value={filters.stage}
                />
                <FilterSelect
                  active={Boolean(filters.status)}
                  icon={Filter}
                  label={filters.status ? labelFor(leadStatuses, filters.status) : "Status"}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      status: event.target.value as LeadStatus | "",
                    }))
                  }
                  options={[{ label: "All statuses", value: "" }, ...leadStatuses]}
                  value={filters.status}
                />
                <FilterSelect
                  active={Boolean(filters.source)}
                  icon={Filter}
                  label={filters.source ? labelFor(leadSources, filters.source) : "Source"}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      source: event.target.value as LeadSource | "",
                    }))
                  }
                  options={[{ label: "All sources", value: "" }, ...leadSources]}
                  value={filters.source}
                />
                <FilterSelect
                  active={Boolean(filters.programId)}
                  icon={SlidersHorizontal}
                  label={
                    filters.programId
                      ? activePrograms.find((program) => program.id === filters.programId)?.name ?? "Program"
                      : "Program"
                  }
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      programId: event.target.value,
                    }))
                  }
                  options={[
                    { label: "All programs", value: "" },
                    ...activePrograms.map((program) => ({
                      label: program.name,
                      value: program.id,
                    })),
                  ]}
                  value={filters.programId}
                />
                <Button className="gap-2" onClick={resetFilters} variant="secondary">
                  <RefreshCw className="size-[var(--icon-sm)]" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <Input
                label="Created from"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, createdFrom: event.target.value }))
                }
                type="date"
                value={filters.createdFrom}
              />
              <Input
                label="Created to"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, createdTo: event.target.value }))
                }
                type="date"
                value={filters.createdTo}
              />
              <Input
                label="Follow-up from"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, followUpFrom: event.target.value }))
                }
                type="date"
                value={filters.followUpFrom}
              />
              <Input
                label="Follow-up to"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, followUpTo: event.target.value }))
                }
                type="date"
                value={filters.followUpTo}
              />
              <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
                <span>Assigned to</span>
                <select
                  className="h-[var(--control-height-lg)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm shadow-[var(--shadow-xs)] outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      assignedUserId: event.target.value,
                    }))
                  }
                  value={filters.assignedUserId}
                >
                  <option value="">Anyone</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.userId} value={assignee.userId}>
                      {assignee.name} ({formatEnum(assignee.role)})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[var(--color-divider)] px-[var(--space-5)] py-[var(--space-4)] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">
                Scoped Lead list
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {canRequestLeads
                  ? `${meta.total} total records from backend metadata`
                  : "Select a valid scope to load Leads."}
              </p>
            </div>
            <Button
              className="gap-2"
              disabled={!canRequestLeads || isListLoading}
              onClick={() => void loadLeadList()}
              variant="secondary"
            >
              {isListLoading ? (
                <Loader2 className="size-[var(--icon-sm)] animate-spin" />
              ) : (
                <RefreshCw className="size-[var(--icon-sm)]" />
              )}
              Refresh
            </Button>
          </div>

          <LeadTable
            isLoading={isListLoading}
            leads={leads}
            metadataLoading={isMetadataLoading}
            onOpenLead={openLeadProfile}
          />

          <Pagination meta={meta} onPageChange={setPage} />
        </Card>
      </div>

      <Dialog
        className="max-w-5xl"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Lead"
      >
        <form className="space-y-[var(--space-5)]" onSubmit={submitLead}>
          {formError ? (
            <Alert tone="danger" onDismiss={() => setFormError("")}>
              {formError}
            </Alert>
          ) : null}
          {phoneConflict ? (
            <ConflictPanel conflict={phoneConflict} onLocate={locateConflict} />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Full name"
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              required
              value={form.fullName}
            />
            <Input
              hint="10 digit Indian mobile numbers are saved as +91 format."
              label="Primary phone"
              onChange={(event) => setForm((current) => ({ ...current, primaryPhone: event.target.value }))}
              required
              value={form.primaryPhone}
            />
            <Input
              label="Alternate phone"
              onChange={(event) => setForm((current) => ({ ...current, alternatePhone: event.target.value }))}
              value={form.alternatePhone}
            />
            <Input
              label="Email"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              type="email"
              value={form.email}
            />
            <Input
              label="Date of birth"
              onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))}
              type="date"
              value={form.dob}
            />
            <SelectField
              label="Source"
              onChange={(value) => setForm((current) => ({ ...current, source: value as LeadSource }))}
              options={leadSources}
              required
              value={form.source}
            />
            <SelectField
              label="Preferred channel"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  preferredChannel: value as LeadCommunicationChannel | "",
                }))
              }
              options={[{ label: "No preference", value: "" }, ...preferredChannels]}
              value={form.preferredChannel}
            />
            <SelectField
              label="Intent"
              onChange={(value) => setForm((current) => ({ ...current, currentIntent: value as LeadCurrentIntent }))}
              options={leadIntentOptions}
              value={form.currentIntent}
            />
            <SelectField
              label="Batch type preference"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  batchTypePref: value as BatchTypePref | "",
                }))
              }
              options={[{ label: "No preference", value: "" }, ...batchTypeOptions]}
              value={form.batchTypePref}
            />
            <SelectField
              label="Preferred batch"
              onChange={(value) => setForm((current) => ({ ...current, preferredBatchId: value }))}
              options={[
                { label: "No preferred batch", value: "" },
                ...branchBatches.map((batch) => ({
                  label: `${batch.name} (${timeRange(batch)})`,
                  value: batch.id,
                })),
              ]}
              value={form.preferredBatchId}
            />
            <SelectField
              label="Assign to"
              onChange={(value) => setForm((current) => ({ ...current, assignedUserId: value }))}
              options={[
                { label: "Unassigned", value: "" },
                ...assignees.map((assignee) => ({
                  label: `${assignee.name} (${formatEnum(assignee.role)})`,
                  value: assignee.userId,
                })),
              ]}
              value={form.assignedUserId}
            />
            <Input
              label="Source details"
              onChange={(event) => setForm((current) => ({ ...current, sourceDetails: event.target.value }))}
              value={form.sourceDetails}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MultiSelect
              label="Programs"
              onChange={(programIds) => setForm((current) => ({ ...current, programIds }))}
              options={activePrograms.map((program) => ({
                label: program.name,
                value: program.id,
              }))}
              values={form.programIds}
            />
            <MultiSelect
              label="Goals"
              onChange={(goalIds) => setForm((current) => ({ ...current, goalIds }))}
              options={activeGoals.map((goal) => ({
                label: goal.name,
                value: goal.id,
              }))}
              values={form.goalIds}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_12rem_12rem]">
            <DayPicker
              onChange={(preferredDays) => setForm((current) => ({ ...current, preferredDays }))}
              values={form.preferredDays}
            />
            <Input
              label="Start time"
              onChange={(event) => setForm((current) => ({ ...current, preferredStartTime: event.target.value }))}
              type="time"
              value={form.preferredStartTime}
            />
            <Input
              label="End time"
              onChange={(event) => setForm((current) => ({ ...current, preferredEndTime: event.target.value }))}
              type="time"
              value={form.preferredEndTime}
            />
          </div>

          <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
            <span>Current summary</span>
            <textarea
              className="min-h-24 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
              onChange={(event) => setForm((current) => ({ ...current, currentSummary: event.target.value }))}
              value={form.currentSummary}
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-[var(--color-divider)] pt-[var(--space-4)]">
            <Button onClick={() => setIsCreateOpen(false)} type="button" variant="secondary">
              Cancel
            </Button>
            <Button className="gap-2" disabled={isSaving || !canRequestLeads} type="submit">
              {isSaving ? (
                <Loader2 className="size-[var(--icon-sm)] animate-spin" />
              ) : (
                <UserPlus className="size-[var(--icon-sm)]" />
              )}
              Create Lead
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        className="max-w-6xl"
        isOpen={isProfileOpen}
        onClose={closeLeadProfile}
        title={selectedLead?.fullName || "Lead profile"}
      >
        <LeadProfileDialog
          activeGoals={activeGoals}
          activePrograms={activePrograms}
          assigneeError={profileAssigneeError}
          assigneeMeta={profileAssigneeMeta}
          assigneePage={profileAssigneePage}
          assigneeSearch={profileAssigneeSearch}
          assignees={profileAssignees}
          assignmentError={assignmentError}
          assignmentValue={assignmentValue}
          branchBatches={branchBatches}
          editConflict={editConflict}
          form={editForm}
          isAssigneesLoading={isProfileAssigneesLoading}
          isEditing={isEditingProfile}
          isLoading={isProfileLoading}
          isSavingAssignment={isUpdatingAssignment}
          isSavingProfile={isUpdatingProfile}
          lead={selectedLead}
          onAssigneePageChange={setProfileAssigneePage}
          onAssigneeSearchChange={(value) => {
            setProfileAssigneeSearch(value);
            setProfileAssigneePage(1);
          }}
          onAssignmentChange={setAssignmentValue}
          onCancelEdit={() => {
            if (selectedLead) setEditForm(leadToForm(selectedLead));
            setIsEditingProfile(false);
            setEditConflict(null);
            setProfileError("");
          }}
          onEdit={() => setIsEditingProfile(true)}
          onFieldChange={setEditForm}
          onLocateConflict={(conflict) => {
            setSearch(conflict.existingLead?.primaryPhone || conflict.existingLead?.fullName || editForm.primaryPhone);
            setFilters((current) => ({ ...current, stage: "", status: "", source: "" }));
            closeLeadProfile();
          }}
          onRetry={() => selectedLeadId && void refreshLeadProfile(selectedLeadId)}
          onSubmitAssignment={submitAssignmentChange}
          onSubmitProfile={submitProfileUpdate}
          profileError={profileError}
          profileStatus={profileStatus}
        />
      </Dialog>
    </AppShell>
  );
}

function LeadProfileDialog({
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
  form,
  isAssigneesLoading,
  isEditing,
  isLoading,
  isSavingAssignment,
  isSavingProfile,
  lead,
  onAssigneePageChange,
  onAssigneeSearchChange,
  onAssignmentChange,
  onCancelEdit,
  onEdit,
  onFieldChange,
  onLocateConflict,
  onRetry,
  onSubmitAssignment,
  onSubmitProfile,
  profileError,
  profileStatus,
}: {
  activeGoals: Goal[];
  activePrograms: Program[];
  assigneeError: string;
  assigneeMeta: PaginationMeta;
  assigneePage: number;
  assigneeSearch: string;
  assignees: LeadAssigneeOption[];
  assignmentError: string;
  assignmentValue: string;
  branchBatches: Batch[];
  editConflict: LeadPhoneConflictError | null;
  form: LeadFormState;
  isAssigneesLoading: boolean;
  isEditing: boolean;
  isLoading: boolean;
  isSavingAssignment: boolean;
  isSavingProfile: boolean;
  lead: LeadDetail | null;
  onAssigneePageChange: (page: number) => void;
  onAssigneeSearchChange: (value: string) => void;
  onAssignmentChange: (value: string) => void;
  onCancelEdit: () => void;
  onEdit: () => void;
  onFieldChange: React.Dispatch<React.SetStateAction<LeadFormState>>;
  onLocateConflict: (conflict: LeadPhoneConflictError) => void;
  onRetry: () => void;
  onSubmitAssignment: (assignedUserId: string | null) => void;
  onSubmitProfile: (event: React.FormEvent<HTMLFormElement>) => void;
  profileError: string;
  profileStatus: number | null;
}) {
  if (isLoading) {
    return (
      <div className="grid min-h-96 place-items-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-secondary)]">
          <Loader2 className="size-[var(--icon-md)] animate-spin text-[var(--color-primary)]" />
          Loading Lead profile
        </div>
      </div>
    );
  }

  if (!lead) {
    const title =
      profileStatus === 403
        ? "Lead profile unavailable"
        : profileStatus === 404
          ? "Lead not found"
          : "Unable to load Lead profile";
    return (
      <div className="grid min-h-96 place-items-center text-center">
        <div className="max-w-md">
          <ShieldAlert className="mx-auto size-10 text-[var(--color-danger)]" />
          <p className="mt-3 text-base font-bold text-[var(--color-text)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {profileError || "The requested Lead could not be loaded."}
          </p>
          <Button className="mt-4 gap-2" onClick={onRetry} variant="secondary">
            <RefreshCw className="size-[var(--icon-sm)]" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const currentAssignee = lead.assignedUser;
  const assignmentOptions = currentAssignee && !assignees.some((assignee) => assignee.userId === currentAssignee.id)
    ? [
        {
          userId: currentAssignee.id,
          name: currentAssignee.name,
          role: currentAssignee.role === "BRANCH_ADMIN" ? "BRANCH_ADMIN" as const : "RECEPTIONIST" as const,
          organizationId: currentAssignee.organizationId ?? lead.organizationId ?? "",
          branchId: currentAssignee.branchId ?? lead.branchId,
        },
        ...assignees,
      ]
    : assignees;

  return (
    <div className="space-y-[var(--space-5)]">
      {profileError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--red-50)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {profileError}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <InitialAvatar name={lead.fullName} tone={avatarTone(lead.id)} />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-[var(--color-text)]">{lead.fullName}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {lead.primaryPhone || "No primary phone"} | {lead.email || "No email"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={statusTone(lead.status)}>{formatEnum(lead.status)}</StatusBadge>
          <StatusBadge status="pending">{formatEnum(lead.stage)}</StatusBadge>
          {!isEditing ? (
            <Button className="gap-2" onClick={onEdit} variant="secondary">
              <Pencil className="size-[var(--icon-sm)]" />
              Edit
            </Button>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <form className="space-y-[var(--space-5)]" onSubmit={onSubmitProfile}>
          {editConflict ? (
            <ConflictPanel conflict={editConflict} onLocate={() => onLocateConflict(editConflict)} />
          ) : null}
          <LeadEditableFields
            activeGoals={activeGoals}
            activePrograms={activePrograms}
            branchBatches={branchBatches}
            form={form}
            onFieldChange={onFieldChange}
          />
          <div className="flex justify-end gap-3 border-t border-[var(--color-divider)] pt-[var(--space-4)]">
            <Button disabled={isSavingProfile} onClick={onCancelEdit} type="button" variant="secondary">
              Cancel
            </Button>
            <Button className="gap-2" disabled={isSavingProfile} type="submit">
              {isSavingProfile ? (
                <Loader2 className="size-[var(--icon-sm)] animate-spin" />
              ) : (
                <Save className="size-[var(--icon-sm)]" />
              )}
              Save profile
            </Button>
          </div>
        </form>
      ) : (
        <LeadDetailView activeGoals={activeGoals} activePrograms={activePrograms} branchBatches={branchBatches} lead={lead} />
      )}

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--color-text)]">Assignment</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {currentAssignee ? `${currentAssignee.name} (${formatEnum(currentAssignee.role)})` : "Unassigned"}
            </p>
          </div>
          <div className="grid w-full gap-3 lg:max-w-xl">
            <Input
              label="Search assignees"
              onChange={(event) => onAssigneeSearchChange(event.target.value)}
              placeholder="Search by name"
              value={assigneeSearch}
            />
            <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
              <span>Eligible assignee</span>
              <select
                className="h-[var(--control-height-lg)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm shadow-[var(--shadow-xs)] outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
                disabled={isAssigneesLoading || !assignmentOptions.length}
                onChange={(event) => onAssignmentChange(event.target.value)}
                value={assignmentValue}
              >
                <option value="">Unassigned</option>
                {assignmentOptions.map((assignee) => (
                  <option key={assignee.userId} value={assignee.userId}>
                    {assignee.name} ({formatEnum(assignee.role)})
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[var(--color-text-secondary)]">
                {isAssigneesLoading ? "Loading assignees" : `${assigneeMeta.total} eligible options`}
              </span>
              <div className="flex gap-2">
                <Button
                  aria-label="Previous assignee page"
                  disabled={isAssigneesLoading || assigneePage <= 1}
                  onClick={() => onAssigneePageChange(Math.max(1, assigneePage - 1))}
                  variant="secondary"
                >
                  <ChevronLeft className="size-[var(--icon-sm)]" />
                </Button>
                <Button
                  aria-label="Next assignee page"
                  disabled={isAssigneesLoading || assigneePage >= Math.max(1, assigneeMeta.totalPages)}
                  onClick={() => onAssigneePageChange(Math.min(Math.max(1, assigneeMeta.totalPages), assigneePage + 1))}
                  variant="secondary"
                >
                  <ChevronRight className="size-[var(--icon-sm)]" />
                </Button>
              </div>
            </div>
            {assigneeError ? <p className="text-sm text-[var(--color-danger)]">{assigneeError}</p> : null}
            {assignmentError ? <p className="text-sm text-[var(--color-danger)]">{assignmentError}</p> : null}
            <div className="flex justify-end gap-3">
              <Button
                className="gap-2"
                disabled={isSavingAssignment || !currentAssignee}
                onClick={() => void onSubmitAssignment(null)}
                variant="secondary"
              >
                {isSavingAssignment ? (
                  <Loader2 className="size-[var(--icon-sm)] animate-spin" />
                ) : (
                  <UserMinus className="size-[var(--icon-sm)]" />
                )}
                Unassign
              </Button>
              <Button
                className="gap-2"
                disabled={isSavingAssignment || !assignmentValue || assignmentValue === (currentAssignee?.id ?? "")}
                onClick={() => void onSubmitAssignment(assignmentValue)}
              >
                {isSavingAssignment ? (
                  <Loader2 className="size-[var(--icon-sm)] animate-spin" />
                ) : (
                  <UserPlus className="size-[var(--icon-sm)]" />
                )}
                Assign
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadEditableFields({
  activeGoals,
  activePrograms,
  branchBatches,
  form,
  onFieldChange,
}: {
  activeGoals: Goal[];
  activePrograms: Program[];
  branchBatches: Batch[];
  form: LeadFormState;
  onFieldChange: React.Dispatch<React.SetStateAction<LeadFormState>>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Full name"
          onChange={(event) => onFieldChange((current) => ({ ...current, fullName: event.target.value }))}
          required
          value={form.fullName}
        />
        <Input
          hint="10 digit Indian mobile numbers are saved as +91 format."
          label="Primary phone"
          onChange={(event) => onFieldChange((current) => ({ ...current, primaryPhone: event.target.value }))}
          required
          value={form.primaryPhone}
        />
        <Input
          label="Alternate phone"
          onChange={(event) => onFieldChange((current) => ({ ...current, alternatePhone: event.target.value }))}
          value={form.alternatePhone}
        />
        <Input
          label="Email"
          onChange={(event) => onFieldChange((current) => ({ ...current, email: event.target.value }))}
          type="email"
          value={form.email}
        />
        <Input
          label="Date of birth"
          onChange={(event) => onFieldChange((current) => ({ ...current, dob: event.target.value }))}
          type="date"
          value={form.dob}
        />
        <SelectField
          label="Source"
          onChange={(value) => onFieldChange((current) => ({ ...current, source: value as LeadSource }))}
          options={leadSources}
          required
          value={form.source}
        />
        <SelectField
          label="Preferred channel"
          onChange={(value) => onFieldChange((current) => ({ ...current, preferredChannel: value as LeadCommunicationChannel | "" }))}
          options={[{ label: "No preference", value: "" }, ...preferredChannels]}
          value={form.preferredChannel}
        />
        <SelectField
          label="Intent"
          onChange={(value) => onFieldChange((current) => ({ ...current, currentIntent: value as LeadCurrentIntent }))}
          options={leadIntentOptions}
          value={form.currentIntent}
        />
        <SelectField
          label="Batch type preference"
          onChange={(value) => onFieldChange((current) => ({ ...current, batchTypePref: value as BatchTypePref | "" }))}
          options={[{ label: "No preference", value: "" }, ...batchTypeOptions]}
          value={form.batchTypePref}
        />
        <SelectField
          label="Preferred batch"
          onChange={(value) => onFieldChange((current) => ({ ...current, preferredBatchId: value }))}
          options={[
            { label: "No preferred batch", value: "" },
            ...branchBatches.map((batch) => ({
              label: `${batch.name} (${timeRange(batch)})`,
              value: batch.id,
            })),
          ]}
          value={form.preferredBatchId}
        />
        <Input
          label="Source details"
          onChange={(event) => onFieldChange((current) => ({ ...current, sourceDetails: event.target.value }))}
          value={form.sourceDetails}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MultiSelect
          label="Programs"
          onChange={(programIds) => onFieldChange((current) => ({ ...current, programIds }))}
          options={activePrograms.map((program) => ({ label: program.name, value: program.id }))}
          values={form.programIds}
        />
        <MultiSelect
          label="Goals"
          onChange={(goalIds) => onFieldChange((current) => ({ ...current, goalIds }))}
          options={activeGoals.map((goal) => ({ label: goal.name, value: goal.id }))}
          values={form.goalIds}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_12rem_12rem]">
        <DayPicker
          onChange={(preferredDays) => onFieldChange((current) => ({ ...current, preferredDays }))}
          values={form.preferredDays}
        />
        <Input
          label="Start time"
          onChange={(event) => onFieldChange((current) => ({ ...current, preferredStartTime: event.target.value }))}
          type="time"
          value={form.preferredStartTime}
        />
        <Input
          label="End time"
          onChange={(event) => onFieldChange((current) => ({ ...current, preferredEndTime: event.target.value }))}
          type="time"
          value={form.preferredEndTime}
        />
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
        <span>Current summary</span>
        <textarea
          className="min-h-24 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
          onChange={(event) => onFieldChange((current) => ({ ...current, currentSummary: event.target.value }))}
          value={form.currentSummary}
        />
      </label>
    </>
  );
}

function LeadDetailView({
  activeGoals,
  activePrograms,
  branchBatches,
  lead,
}: {
  activeGoals: Goal[];
  activePrograms: Program[];
  branchBatches: Batch[];
  lead: LeadDetail;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DetailSection title="Identity">
        <DetailItem label="Full name" value={lead.fullName} />
        <DetailItem label="Primary phone" value={lead.primaryPhone} />
        <DetailItem label="Alternate phone" value={lead.alternatePhone} />
        <DetailItem label="Email" value={lead.email} />
        <DetailItem label="Date of birth" value={formatDateOnly(lead.dob)} />
      </DetailSection>
      <DetailSection title="Acquisition">
        <DetailItem label="Source" value={formatEnum(lead.source)} />
        <DetailItem label="Source details" value={lead.sourceDetails} />
        <DetailItem label="Preferred channel" value={formatEnum(lead.preferredChannel)} />
        <DetailItem label="Current intent" value={formatEnum(lead.currentIntent)} />
        <DetailItem label="Current summary" value={lead.currentSummary} />
      </DetailSection>
      <DetailSection title="Preferences">
        <DetailItem label="Batch type" value={formatEnum(lead.batchTypePref)} />
        <DetailItem label="Preferred batch" value={batchNameFor(lead.preferredBatchId, branchBatches)} />
        <DetailItem label="Preferred days" value={formatDays(lead.preferredDays)} />
        <DetailItem label="Preferred time" value={formatPreferredTime(lead.preferredStartTime, lead.preferredEndTime)} />
        <DetailItem label="Programs" value={formatLeadPrograms(lead, activePrograms)} />
        <DetailItem label="Goals" value={formatLeadGoals(lead, activeGoals)} />
      </DetailSection>
      <DetailSection title="Operations">
        <DetailItem label="Stage" value={formatEnum(lead.stage)} />
        <DetailItem label="Status" value={formatEnum(lead.status)} />
        <DetailItem label="Current assignee" value={formatSafeUser(lead.assignedUser)} />
        <DetailItem label="Last contacted" value={formatDateTime(lead.lastContactedAt)} />
        <DetailItem label="Next follow-up" value={formatDateTime(lead.nextFollowUpAt)} />
        <DetailItem label="Last visited" value={formatDateTime(lead.lastVisitedAt)} />
      </DetailSection>
      <DetailSection title="Lifecycle">
        <DetailItem label="Lost reason" value={formatEnum(lead.lostReason)} />
        <DetailItem label="Lost explanation" value={lead.lostExplanation} />
        <DetailItem label="Lost at" value={formatDateTime(lead.lostAt)} />
        <DetailItem label="Re-engaged at" value={formatDateTime(lead.reengagedAt)} />
        <DetailItem label="Archived at" value={formatDateTime(lead.archivedAt)} />
        <DetailItem label="Converted at" value={formatDateTime(lead.convertedAt)} />
      </DetailSection>
      <DetailSection title="Audit">
        <DetailItem label="Created" value={formatDateTime(lead.createdAt)} />
        <DetailItem label="Updated" value={formatDateTime(lead.updatedAt)} />
        <DetailItem label="Created by" value={formatSafeUser(lead.createdByUser)} />
        <DetailItem label="Updated by" value={formatSafeUser(lead.updatedByUser)} />
        <DetailItem label="Archived by" value={formatSafeUser(lead.archivedByUser)} />
      </DetailSection>
    </div>
  );
}

function DetailSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <h3 className="text-sm font-bold text-[var(--color-text)]">{title}</h3>
      <dl className="mt-3 grid gap-3">{children}</dl>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-bold uppercase text-[var(--color-text-muted)]">{label}</dt>
      <dd className="break-words text-sm text-[var(--color-text)]">{isEmptyValue(value) ? "Not set" : value}</dd>
    </div>
  );
}

function ScopePanel({
  branches,
  effectiveBranchId,
  isLoading,
  organizations,
  selectedBranch,
  selectedBranchId,
  selectedOrganization,
  selectedOrganizationId,
  setSelectedBranchId,
  setSelectedOrganizationId,
  user,
}: {
  branches: Branch[];
  effectiveBranchId: string;
  isLoading: boolean;
  organizations: Organization[];
  selectedBranch: Branch | undefined;
  selectedBranchId: string;
  selectedOrganization: Organization | undefined;
  selectedOrganizationId: string;
  setSelectedBranchId: (branchId: string) => void;
  setSelectedOrganizationId: (organizationId: string) => void;
  user: AuthUser | null;
}) {
  const role = user?.role;

  return (
    <Card className="p-[var(--card-padding)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">
            Lead scope
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {scopeDescription(role)}
          </p>
        </div>
        {isLoading ? (
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            <Loader2 className="size-[var(--icon-sm)] animate-spin" />
            Loading scope
          </div>
        ) : null}
        <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2 lg:max-w-3xl">
          {role === "CRM_OWNER" ? (
            <SelectField
              label="Organization"
              onChange={(value) => {
                setSelectedOrganizationId(value);
                setSelectedBranchId("");
              }}
              options={[
                { label: "Select organization", value: "" },
                ...organizations.map((organization) => ({
                  label: organization.name,
                  value: organization.id,
                })),
              ]}
              value={selectedOrganizationId}
            />
          ) : (
            <ScopeValue
              label="Organization"
              value={selectedOrganization?.name || user?.organizationId || "Assigned organization"}
            />
          )}

          {role === "CRM_OWNER" || role === "ORGANIZATION_OWNER" ? (
            <SelectField
              disabled={role === "CRM_OWNER" && !selectedOrganizationId}
              label="Branch"
              onChange={setSelectedBranchId}
              options={[
                { label: "Select branch", value: "" },
                ...branches.map((branch) => ({
                  label: branch.name,
                  value: branch.id,
                })),
              ]}
              value={selectedBranchId}
            />
          ) : (
            <ScopeValue
              label="Branch"
              value={selectedBranch?.name || shortId(effectiveBranchId) || "Assigned branch"}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

function LeadTable({
  isLoading,
  leads,
  metadataLoading,
  onOpenLead,
}: {
  isLoading: boolean;
  leads: LeadSummary[];
  metadataLoading: boolean;
  onOpenLead: (leadId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid min-h-80 place-items-center px-[var(--space-5)] py-[var(--space-8)]">
        <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-secondary)]">
          <Loader2 className="size-[var(--icon-md)] animate-spin text-[var(--color-primary)]" />
          Loading Leads
        </div>
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="grid min-h-80 place-items-center px-[var(--space-5)] py-[var(--space-8)] text-center">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">
            No Leads found
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Adjust the filters or create a Lead in the selected Branch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--color-divider)] text-left text-sm">
        <thead className="bg-[var(--color-surface-muted)] text-xs font-bold uppercase text-[var(--color-text-muted)]">
          <tr>
            {[
              "Lead",
              "Stage",
              "Status",
              "Source",
              "Intent",
              "Owner",
              "Next follow-up",
              "Created",
              "",
            ].map((heading) => (
              <th className="px-4 py-3" key={heading}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-divider)]">
          {leads.map((lead) => (
            <tr className="hover:bg-[var(--color-surface-hover)]" key={lead.id}>
              <td className="min-w-72 px-4 py-4">
                <div className="flex items-center gap-3">
                  <InitialAvatar name={lead.fullName} tone={avatarTone(lead.id)} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--color-text)]">
                      {lead.fullName}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-secondary)]">
                      {lead.primaryPhone || "No phone"}{lead.email ? ` | ${lead.email}` : ""}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {formatEnum(lead.stage)}
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={statusTone(lead.status)}>
                  {formatEnum(lead.status)}
                </StatusBadge>
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {formatEnum(lead.source)}
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {formatEnum(lead.currentIntent)}
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {metadataLoading ? "Loading" : lead.assignedUser?.name || "Unassigned"}
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {formatDateTime(lead.nextFollowUpAt)}
              </td>
              <td className="px-4 py-4 text-[var(--color-text-secondary)]">
                {formatDateTime(lead.createdAt)}
              </td>
              <td className="px-4 py-4 text-right">
                <Button
                  aria-label={`Open ${lead.fullName} profile`}
                  className="gap-2"
                  onClick={() => onOpenLead(lead.id)}
                  variant="secondary"
                >
                  <Eye className="size-[var(--icon-sm)]" />
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const start = meta.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const end = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--color-divider)] px-[var(--space-5)] py-[var(--space-4)] text-sm text-[var(--color-text-secondary)] md:flex-row md:items-center md:justify-between">
      <span>
        Showing {start}-{end} of {meta.total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Previous page"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(Math.max(1, meta.page - 1))}
          variant="secondary"
        >
          <ChevronLeft className="size-[var(--icon-sm)]" />
        </Button>
        <span className="min-w-24 text-center font-semibold text-[var(--color-text)]">
          Page {meta.page} of {Math.max(1, meta.totalPages)}
        </span>
        <Button
          aria-label="Next page"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(Math.min(meta.totalPages, meta.page + 1))}
          variant="secondary"
        >
          <ChevronRight className="size-[var(--icon-sm)]" />
        </Button>
      </div>
    </div>
  );
}

function Alert({
  children,
  onDismiss,
  tone,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
  tone: "danger" | "success" | "warning";
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        tone === "success" &&
          "border-[var(--color-success)] bg-[var(--green-50)] text-[var(--color-success)]",
        tone === "danger" &&
          "border-[var(--color-danger)] bg-[var(--red-50)] text-[var(--color-danger)]",
        tone === "warning" &&
          "border-[var(--yellow-300)] bg-[var(--yellow-50)] text-[var(--yellow-800)]",
      )}
    >
      <Icon className="mt-0.5 size-[var(--icon-sm)] shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      <button className="font-bold" onClick={onDismiss} type="button">
        Dismiss
      </button>
    </div>
  );
}

function ConflictPanel({
  conflict,
  onLocate,
}: {
  conflict: LeadPhoneConflictError;
  onLocate: () => void;
}) {
  const existingLead = conflict.existingLead;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--red-50)] p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-[var(--icon-sm)] text-[var(--color-danger)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--color-danger)]">
            Duplicate phone found
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {conflict.message}
          </p>
          {existingLead ? (
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              Existing Lead: {existingLead.fullName} | {existingLead.primaryPhone} | {formatEnum(existingLead.stage)} | {formatEnum(existingLead.status)}
            </p>
          ) : null}
        </div>
        <Button onClick={onLocate} type="button" variant="secondary">
          Show in list
        </Button>
      </div>
    </div>
  );
}

function SelectField({
  disabled,
  label,
  onChange,
  options,
  required,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
      <span>{label}</span>
      <select
        className="h-[var(--control-height-lg)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm shadow-[var(--shadow-xs)] outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)] disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-disabled)]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelect({
  label,
  onChange,
  options,
  values,
}: {
  label: string;
  onChange: (values: string[]) => void;
  options: Array<{ label: string; value: string }>;
  values: string[];
}) {
  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((id) => id !== value) : [...values, value]);
  }

  return (
    <fieldset className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <legend className="px-1 text-sm font-bold text-[var(--color-text)]">
        {label}
      </legend>
      {options.length ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label
              className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
              key={option.value}
            >
              <input
                checked={values.includes(option.value)}
                onChange={() => toggle(option.value)}
                type="checkbox"
              />
              <span className="min-w-0 truncate">{option.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          No active {label.toLowerCase()} available.
        </p>
      )}
    </fieldset>
  );
}

function DayPicker({
  onChange,
  values,
}: {
  onChange: (values: number[]) => void;
  values: number[];
}) {
  function toggle(value: number) {
    onChange(
      values.includes(value)
        ? values.filter((day) => day !== value)
        : [...values, value].sort((first, second) => first - second),
    );
  }

  return (
    <fieldset className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <legend className="px-1 text-sm font-bold text-[var(--color-text)]">
        Preferred days
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {dayOptions.map((day) => (
          <button
            className={cn(
              "h-9 min-w-12 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-secondary)]",
              values.includes(day.value) &&
                "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
            )}
            key={day.value}
            onClick={() => toggle(day.value)}
            type="button"
          >
            {day.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ScopeValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
      <span>{label}</span>
      <div className="flex h-[var(--control-height-lg)] items-center rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-[var(--control-padding-x)] text-sm text-[var(--color-text-secondary)]">
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function buildCreatePayload(
  form: LeadFormState,
  branchBatches: Batch[],
  activePrograms: Program[],
  activeGoals: Goal[],
  assignees: LeadAssigneeOption[],
): CreateLeadRequest {
  const fullName = form.fullName.trim();
  if (fullName.length < 2) throw new Error("Enter the Lead's full name.");

  const primaryPhone = normalizeIndianMobile(form.primaryPhone);
  if (!primaryPhone) throw new Error("Enter a valid Indian primary phone number.");

  const alternatePhone = form.alternatePhone.trim()
    ? normalizeIndianMobile(form.alternatePhone)
    : null;
  if (form.alternatePhone.trim() && !alternatePhone) {
    throw new Error("Enter a valid Indian alternate phone number.");
  }
  if (alternatePhone && alternatePhone === primaryPhone) {
    throw new Error("Alternate phone must be different from the primary phone.");
  }

  const email = form.email.trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (Boolean(form.preferredStartTime) !== Boolean(form.preferredEndTime)) {
    throw new Error("Enter both preferred start and end times.");
  }
  if (
    form.preferredStartTime &&
    form.preferredEndTime &&
    form.preferredStartTime >= form.preferredEndTime
  ) {
    throw new Error("Preferred end time must be after the start time.");
  }

  const allowedBatchIds = new Set(branchBatches.map((batch) => batch.id));
  const allowedProgramIds = new Set(activePrograms.map((program) => program.id));
  const allowedGoalIds = new Set(activeGoals.map((goal) => goal.id));
  const allowedAssigneeIds = new Set(assignees.map((assignee) => assignee.userId));
  const programIds = form.programIds.filter((programId) => allowedProgramIds.has(programId));
  const goalIds = form.goalIds.filter((goalId) => allowedGoalIds.has(goalId));
  if (form.assignedUserId && !allowedAssigneeIds.has(form.assignedUserId)) {
    throw new Error("Choose an eligible assignee from the scoped Branch list.");
  }

  const payload: CreateLeadRequest = {
    currentIntent: form.currentIntent,
    fullName,
    primaryPhone,
    source: form.source,
  };

  if (alternatePhone) payload.alternatePhone = alternatePhone;
  if (email) payload.email = email;
  if (form.dob) payload.dob = form.dob;
  if (form.sourceDetails.trim()) payload.sourceDetails = form.sourceDetails.trim();
  if (form.preferredChannel) payload.preferredChannel = form.preferredChannel;
  if (form.batchTypePref) payload.batchTypePref = form.batchTypePref;
  if (form.preferredBatchId && allowedBatchIds.has(form.preferredBatchId)) {
    payload.preferredBatchId = form.preferredBatchId;
  }
  if (form.preferredDays.length) payload.preferredDays = form.preferredDays;
  if (form.preferredStartTime) payload.preferredStartTime = form.preferredStartTime;
  if (form.preferredEndTime) payload.preferredEndTime = form.preferredEndTime;
  if (programIds.length) payload.programIds = programIds;
  if (goalIds.length) payload.goalIds = goalIds;
  if (form.assignedUserId) payload.assignedUserId = form.assignedUserId;
  if (form.currentSummary.trim()) payload.currentSummary = form.currentSummary.trim();

  return payload;
}

function buildUpdatePayload(
  form: LeadFormState,
  branchBatches: Batch[],
  activePrograms: Program[],
  activeGoals: Goal[],
): UpdateLeadRequest {
  const fullName = form.fullName.trim();
  if (fullName.length < 2) throw new Error("Enter the Lead's full name.");

  const primaryPhone = normalizeIndianMobile(form.primaryPhone);
  if (!primaryPhone) throw new Error("Enter a valid Indian primary phone number.");

  const alternatePhone = form.alternatePhone.trim()
    ? normalizeIndianMobile(form.alternatePhone)
    : null;
  if (form.alternatePhone.trim() && !alternatePhone) {
    throw new Error("Enter a valid Indian alternate phone number.");
  }
  if (alternatePhone && alternatePhone === primaryPhone) {
    throw new Error("Alternate phone must be different from the primary phone.");
  }

  const email = form.email.trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (Boolean(form.preferredStartTime) !== Boolean(form.preferredEndTime)) {
    throw new Error("Enter both preferred start and end times.");
  }
  if (
    form.preferredStartTime &&
    form.preferredEndTime &&
    form.preferredStartTime >= form.preferredEndTime
  ) {
    throw new Error("Preferred end time must be after the start time.");
  }

  const allowedBatchIds = new Set(branchBatches.map((batch) => batch.id));
  const allowedProgramIds = new Set(activePrograms.map((program) => program.id));
  const allowedGoalIds = new Set(activeGoals.map((goal) => goal.id));
  if (form.preferredBatchId && !allowedBatchIds.has(form.preferredBatchId)) {
    throw new Error("Choose a preferred Batch from this Lead's Branch.");
  }

  return {
    alternatePhone,
    batchTypePref: form.batchTypePref || null,
    currentIntent: form.currentIntent,
    currentSummary: form.currentSummary.trim() || null,
    dob: form.dob || null,
    email: email || null,
    fullName,
    goalIds: form.goalIds.filter((goalId) => allowedGoalIds.has(goalId)),
    preferredBatchId: form.preferredBatchId || null,
    preferredChannel: form.preferredChannel || null,
    preferredDays: form.preferredDays,
    preferredEndTime: form.preferredEndTime || null,
    preferredStartTime: form.preferredStartTime || null,
    primaryPhone,
    programIds: form.programIds.filter((programId) => allowedProgramIds.has(programId)),
    source: form.source,
    sourceDetails: form.sourceDetails.trim() || null,
  };
}

function leadToForm(lead: LeadDetail): LeadFormState {
  return {
    alternatePhone: lead.alternatePhone ?? "",
    assignedUserId: "",
    batchTypePref: lead.batchTypePref ?? "",
    currentIntent: lead.currentIntent,
    currentSummary: lead.currentSummary ?? "",
    dob: dateInputValue(lead.dob),
    email: lead.email ?? "",
    fullName: lead.fullName,
    goalIds: lead.goals.map((goal) => goal.goalId),
    preferredBatchId: lead.preferredBatchId ?? "",
    preferredChannel: lead.preferredChannel ?? "",
    preferredDays: lead.preferredDays ?? [],
    preferredEndTime: timeInputValue(lead.preferredEndTime),
    preferredStartTime: timeInputValue(lead.preferredStartTime),
    primaryPhone: lead.primaryPhone ?? "",
    programIds: lead.interests.map((interest) => interest.programId),
    source: lead.source,
    sourceDetails: lead.sourceDetails ?? "",
  };
}

function normalizeIndianMobile(input: string) {
  const raw = input.trim();
  const digits = raw.replace(/\D/g, "");
  const withoutCountry =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 10
        ? digits
        : "";

  if (!/^[6-9]\d{9}$/.test(withoutCountry)) return null;
  return `+91${withoutCountry}`;
}

function labelFor<T extends string>(options: Array<{ label: string; value: T }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? formatEnum(value);
}

function batchNameFor(batchId: string | null, batches: Batch[]) {
  if (!batchId) return "Not set";
  const batch = batches.find((item) => item.id === batchId);
  return batch ? `${batch.name} (${timeRange(batch)})` : shortId(batchId);
}

function formatLeadPrograms(lead: LeadDetail, programs: Program[]) {
  if (!lead.interests.length) return "Not set";
  return lead.interests
    .map((interest) => interest.program?.name ?? programs.find((program) => program.id === interest.programId)?.name ?? shortId(interest.programId))
    .join(", ");
}

function formatLeadGoals(lead: LeadDetail, goals: Goal[]) {
  if (!lead.goals.length) return "Not set";
  return lead.goals
    .map((goal) => goal.goal?.name ?? goals.find((item) => item.id === goal.goalId)?.name ?? shortId(goal.goalId))
    .join(", ");
}

function formatDays(days?: number[] | null) {
  if (!days?.length) return "Not set";
  const labels = new Map(dayOptions.map((day) => [day.value, day.label]));
  return days.map((day) => labels.get(day) ?? String(day)).join(", ");
}

function formatPreferredTime(start?: string | null, end?: string | null) {
  if (!start && !end) return "Not set";
  return `${timeInputValue(start) || "Not set"}-${timeInputValue(end) || "Not set"}`;
}

function formatSafeUser(user?: LeadDetail["assignedUser"] | null) {
  if (!user) return "Not set";
  return `${user.name} (${formatEnum(user.role)})`;
}

function isEmptyValue(value: React.ReactNode) {
  return value === null || value === undefined || value === "";
}

function scopeDescription(role?: AuthUser["role"]) {
  if (role === "CRM_OWNER") return "Choose the Organization and Branch before requesting Leads.";
  if (role === "ORGANIZATION_OWNER") return "Choose one of your active Branches.";
  if (role === "BRANCH_ADMIN" || role === "RECEPTIONIST") {
    return "Your authenticated Branch scope is applied automatically.";
  }
  return "Lead access depends on your authenticated role.";
}

function formatEnum(value?: string | null) {
  if (!value) return "None";
  return value
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
}

function statusTone(status: LeadStatus) {
  if (status === "FOLLOW_UP") return "pending";
  if (status === "ARCHIVED" || status === "DORMANT") return "lost";
  return "active";
}

function avatarTone(id: string) {
  const tones = ["blue", "green", "orange", "purple", "red", "teal"] as const;
  return tones[id.charCodeAt(0) % tones.length];
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value?: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

function dateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function timeInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

function timeRange(batch: Batch) {
  return `${batch.startTime.slice(0, 5)}-${batch.endTime.slice(0, 5)}`;
}

function dateFilterValue(value: string, edge: "start" | "end") {
  if (!value) return undefined;
  return `${value}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}Z`;
}

function shortId(id: string) {
  if (!id) return "";
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}
