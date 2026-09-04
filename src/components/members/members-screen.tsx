"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Calendar,
  CalendarDays,
  ChevronDown,
  Filter,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Tag as TagIcon,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FilterButton } from "@/components/ui/filter-button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AuthUser } from "@/lib/api/auth";
import { getBatches, type Batch } from "@/lib/api/batches";
import {
  addMemberFollowUp,
  addMemberTag,
  createMember,
  createSavedView,
  deleteMember,
  deleteSavedView,
  getMember,
  getMemberFollowUps,
  getMemberPreset,
  getMembers,
  getSavedViews,
  removeMemberTag,
  updateMember,
  type CreateMemberPayload,
  type ExpiryFilter,
  type FollowUpOutcome,
  type Member,
  type MemberFollowUp,
  type MemberPreset,
  type MemberSort,
  type MemberStatus,
  type SavedView,
  type UpdateMemberPayload,
} from "@/lib/api/members";
import {
  cancelMembership,
  createMembership,
  getMemberships,
  updateMembership,
  type Membership,
} from "@/lib/api/memberships";
import { getPlanCategories, type PlanCategory } from "@/lib/api/plan-categories";
import { getPlans, type Plan } from "@/lib/api/plans";
import { getPrograms, type Program } from "@/lib/api/programs";
import { getTags, type Tag } from "@/lib/api/tags";
import { getAccessToken, getStoredUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type MemberFormState = CreateMemberPayload & {
  batchId?: string;
  endDate?: string;
  invoiceDate?: string;
  planActualPrice?: string;
  planId?: string;
  purchasePrice?: string;
  startDate?: string;
  status?: MemberStatus;
};

type AdvancedFilters = {
  batchId: string;
  planId: string;
  tagId: string;
  expiry: ExpiryFilter;
};

type JoinedRange = "ALL" | "THIS_MONTH" | "LAST_30_DAYS" | "THIS_YEAR";

const emptyMemberForm: MemberFormState = {
  address: "",
  dob: "",
  email: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  name: "",
  phone: "",
  batchId: "",
  endDate: "",
  invoiceDate: "",
  planActualPrice: "",
  planId: "",
  purchasePrice: "",
  startDate: "",
  status: "PENDING_ACTIVATION",
  tagIds: [],
};

const joinedRangeOptions: Array<{ label: string; value: JoinedRange }> = [
  { label: "All Time", value: "ALL" },
  { label: "This Month", value: "THIS_MONTH" },
  { label: "Last 30 Days", value: "LAST_30_DAYS" },
  { label: "This Year", value: "THIS_YEAR" },
];

const expiryOptions: Array<{ label: string; value: ExpiryFilter }> = [
  { label: "Any Expiry", value: "ANY" },
  { label: "Expiring Today", value: "EXPIRING_TODAY" },
  { label: "In 3 Days", value: "EXPIRING_IN_3_DAYS" },
  { label: "In 7 Days", value: "EXPIRING_IN_7_DAYS" },
  { label: "In 15 Days", value: "EXPIRING_IN_15_DAYS" },
  { label: "In 30 Days", value: "EXPIRING_IN_30_DAYS" },
  { label: "Already Expired", value: "ALREADY_EXPIRED" },
];

const statusTabs: Array<{
  label: string;
  preset?: MemberPreset;
  status?: MemberStatus;
  tone: string;
}> = [
  { label: "All Members", tone: "bg-[var(--blue-100)] text-[var(--color-primary)]" },
  { label: "Active", status: "ACTIVE", tone: "bg-[var(--green-100)] text-[var(--green-700)]" },
  { label: "Pending Activation", preset: "pending-activation", status: "PENDING_ACTIVATION", tone: "bg-[var(--amber-100)] text-[var(--amber-700)]" },
  { label: "Expiring Soon", status: "EXPIRING_SOON", tone: "bg-[var(--amber-100)] text-[var(--amber-700)]" },
  { label: "Frozen", preset: "frozen", status: "FROZEN", tone: "bg-[var(--violet-100)] text-[var(--violet-700)]" },
  { label: "Inactive", preset: "inactive", status: "INACTIVE", tone: "bg-[var(--red-100)] text-[var(--red-700)]" },
  { label: "Lost/Declined", status: "LOST_DECLINE", tone: "bg-[var(--gray-100)] text-[var(--gray-600)]" },
];

const presetFilters: Array<{ label: string; preset: MemberPreset }> = [
  { label: "Renewals Due This Week", preset: "renewals-due-this-week" },
  { label: "Recently Expired", preset: "recently-expired" },
];

const newMemberTrend: Array<[string, number]> = [
  ["August 2026", 0],
  ["July 2026", 4],
  ["June 2026", 1],
  ["May 2026", 2],
  ["April 2026", 1],
  ["March 2026", 0],
];

const renewalTrend: Array<[string, number]> = [
  ["August 2026", 13],
  ["July 2026", 10],
  ["June 2026", 11],
  ["May 2026", 9],
  ["April 2026", 9],
  ["March 2026", 14],
];

export function MembersScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [planCategories, setPlanCategories] = useState<PlanCategory[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeStatus, setActiveStatus] = useState<MemberStatus | undefined>();
  const [activePreset, setActivePreset] = useState<MemberPreset | undefined>();
  const [joinedRange, setJoinedRange] = useState<JoinedRange>("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<MemberSort>("RECENTLY_ADDED");
  const [filters, setFilters] = useState<AdvancedFilters>({
    batchId: "",
    expiry: "ANY",
    planId: "",
    tagId: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [memberDialogMode, setMemberDialogMode] = useState<"create" | "edit" | null>(null);
  const [memberForm, setMemberForm] = useState<MemberFormState>(emptyMemberForm);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [followUps, setFollowUps] = useState<MemberFollowUp[]>([]);
  const [followUpForm, setFollowUpForm] = useState({
    note: "",
    outcome: "PENDING" as FollowUpOutcome,
    scheduledAt: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSavedViews, setShowSavedViews] = useState(false);
  const [savedViewName, setSavedViewName] = useState("");
  const [viewToDelete, setViewToDelete] = useState<SavedView | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const loadMetadata = useCallback(async (accessToken: string) => {
    const [viewData, tagData, planData, batchData, membershipData, categoryData, programData] = await Promise.all([
      getSavedViews(accessToken),
      getTags(accessToken),
      getPlans(accessToken),
      getBatches(accessToken),
      getMemberships(accessToken),
      getPlanCategories(accessToken),
      getPrograms(accessToken),
    ]);
    setSavedViews(viewData);
    setTags(tagData);
    setPlans(planData);
    setBatches(batchData);
    setMemberships(membershipData);
    setPlanCategories(categoryData);
    setPrograms(programData);
  }, []);

  const loadMembers = useCallback(
    async (accessToken = token) => {
      if (!accessToken) return;

      setIsLoading(true);
      try {
        const data = activePreset
          ? await getMemberPreset(accessToken, activePreset)
          : await getMembers(accessToken, {
              batchId: filters.batchId,
              expiry: filters.expiry,
              planId: filters.planId,
              search,
              sort,
              status: activeStatus,
              tagId: filters.tagId,
            });

        setMembers(data);
        setError("");
      } catch (apiError) {
        setError(
          apiError instanceof Error ? apiError.message : "Unable to load members.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activePreset, activeStatus, filters, search, sort, token],
  );

  useEffect(() => {
    const accessToken = getAccessToken();
    const storedUser = getStoredUser();

    if (!accessToken) {
      router.replace("/");
      return;
    }

    setToken(accessToken);
    setUser(storedUser);
    loadMetadata(accessToken).catch((apiError) => {
      setError(apiError instanceof Error ? apiError.message : "Unable to load member metadata.");
    });
  }, [loadMetadata, router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadMembers();
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [loadMembers]);

  const counts = useMemo(() => {
    return statusTabs.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.label] = tab.status
        ? members.filter((member) => member.status === tab.status).length
        : members.length;
      return acc;
    }, {});
  }, [members]);

  const currentMembershipByMemberId = useMemo(() => {
    return memberships.reduce<Record<string, Membership>>((acc, membership) => {
      const current = acc[membership.memberId];
      if (!current || new Date(membership.createdAt) > new Date(current.createdAt)) {
        acc[membership.memberId] = membership;
      }
      return acc;
    }, {});
  }, [memberships]);

  const visibleMembers = useMemo(() => {
    return members.filter((member) => isInJoinedRange(member.joinedOn, joinedRange));
  }, [joinedRange, members]);

  const programNameByPlanId = useMemo(() => {
    const categoryById = Object.fromEntries(
      planCategories.map((category) => [category.id, category]),
    );
    const programById = Object.fromEntries(
      programs.map((program) => [program.id, program]),
    );

    return Object.fromEntries(
      plans.map((plan) => {
        const category = categoryById[plan.categoryId];
        const program = category ? programById[category.programId] : undefined;
        return [plan.id, program?.name ?? "—"];
      }),
    );
  }, [planCategories, plans, programs]);

  const activeFilterCount = useMemo(() => {
    return [filters.batchId, filters.planId, filters.tagId, filters.expiry !== "ANY" ? filters.expiry : ""].filter(Boolean).length;
  }, [filters]);

  const openCreateDialog = () => {
    setSelectedMember(null);
    setMemberForm(emptyMemberForm);
    setMemberDialogMode("create");
  };

  const openEditDialog = (member: Member) => {
    setSelectedMember(member);
    setMemberForm({
      address: member.address ?? "",
      dob: dateOnly(member.dob),
      email: member.email ?? "",
      emergencyContactName: member.emergencyContactName ?? "",
      emergencyContactNumber: member.emergencyContactNumber ?? "",
      name: member.name,
      phone: member.phone,
      batchId: "",
      endDate: "",
      invoiceDate: "",
      planActualPrice: "",
      planId: "",
      purchasePrice: "",
      startDate: "",
      status: member.status,
      tagIds: member.tags?.map((tag) => tag.tagId) ?? [],
    });

    const membership = currentMembershipByMemberId[member.id];
    if (membership) {
      setMemberForm((form) => ({
        ...form,
        batchId: membership.batchId ?? "",
        endDate: dateOnly(membership.endDate),
        invoiceDate: dateOnly(membership.invoiceDate),
        planActualPrice: String(membership.planActualPrice ?? ""),
        planId: membership.planId,
        purchasePrice: String(membership.purchasePrice ?? ""),
        startDate: dateOnly(membership.startDate),
      }));
    }

    setMemberDialogMode("edit");
  };

  const handleSaveMember = async () => {
    if (!token) return;

    setIsSaving(true);
    setNotice("");
    try {
      const { membershipPayload, memberPayload } = splitMemberForm(memberForm);
      if (memberDialogMode === "edit" && selectedMember) {
        await updateMember(token, selectedMember.id, memberPayload as UpdateMemberPayload);
        const currentMembership = currentMembershipByMemberId[selectedMember.id];
        if (membershipPayload) {
          if (currentMembership) {
            await updateMembership(token, currentMembership.id, membershipPayload);
          } else {
            await createMembership(token, {
              ...membershipPayload,
              memberId: selectedMember.id,
            });
          }
        }
        setNotice("Member updated.");
      } else {
        const { status: _status, ...createPayload } = memberPayload;
        const member = await createMember(token, createPayload as CreateMemberPayload);
        if (membershipPayload) {
          await createMembership(token, {
            ...membershipPayload,
            memberId: member.id,
          });
        }
        setNotice("Member created.");
      }

      setMemberDialogMode(null);
      await loadMetadata(token);
      await loadMembers();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to save member.");
    } finally {
      setIsSaving(false);
    }
  };

  const openMemberDetails = async (member: Member) => {
    if (!token) return;

    setSelectedMember(member);
    setDetailMember(member);
    setFollowUps([]);
    setError("");
    try {
      const [freshMember, memberFollowUps] = await Promise.all([
        getMember(token, member.id),
        getMemberFollowUps(token, member.id),
      ]);
      setDetailMember(freshMember);
      setFollowUps(memberFollowUps);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to load member details.");
    }
  };

  const reloadMemberDetails = async (memberId: string) => {
    if (!token) return;

    const [freshMember, memberFollowUps] = await Promise.all([
      getMember(token, memberId),
      getMemberFollowUps(token, memberId),
    ]);
    setDetailMember(freshMember);
    setFollowUps(memberFollowUps);
    await loadMembers();
  };

  const handleAddFollowUp = async () => {
    if (!token || !detailMember || !followUpForm.scheduledAt) return;

    setIsSaving(true);
    try {
      await addMemberFollowUp(token, detailMember.id, {
        note: followUpForm.note.trim() || undefined,
        outcome: followUpForm.outcome,
        scheduledAt: new Date(followUpForm.scheduledAt).toISOString(),
      });
      setFollowUpForm({ note: "", outcome: "PENDING", scheduledAt: "" });
      await reloadMemberDetails(detailMember.id);
      setNotice("Follow-up added.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to add follow-up.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTag = async (tag: Tag) => {
    if (!token || !detailMember) return;

    setIsSaving(true);
    try {
      const hasTag = detailMember.tags?.some((memberTag) => memberTag.tagId === tag.id);
      if (hasTag) {
        await removeMemberTag(token, detailMember.id, tag.id);
      } else {
        await addMemberTag(token, detailMember.id, tag.id);
      }
      await reloadMemberDetails(detailMember.id);
      setNotice(hasTag ? "Tag removed." : "Tag added.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to update tag.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!token || !memberToDelete) return;

    setIsSaving(true);
    try {
      await deleteMember(token, memberToDelete.id);
      setMemberToDelete(null);
      setDetailMember(null);
      setNotice("Member deleted.");
      await loadMembers();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to delete member.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCurrentView = async () => {
    if (!token || !savedViewName.trim()) return;

    setIsSaving(true);
    try {
      await createSavedView(token, {
        name: savedViewName.trim(),
        filterJson: {
          activePreset,
          activeStatus,
          joinedRange,
          ...filters,
          search,
          sort,
        },
      });
      setSavedViewName("");
      await loadMetadata(token);
      setNotice("Saved view created.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to save view.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelMembership = async (membership: Membership) => {
    if (!token) return;

    setIsSaving(true);
    try {
      await cancelMembership(token, membership.id);
      await loadMetadata(token);
      setNotice("Membership cancelled.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to cancel membership.");
    } finally {
      setIsSaving(false);
    }
  };

  const applySavedView = (view: SavedView) => {
    const data = view.filterJson as Partial<AdvancedFilters> & {
      activePreset?: MemberPreset;
      activeStatus?: MemberStatus;
      joinedRange?: JoinedRange;
      search?: string;
      sort?: MemberSort;
    };

    setActivePreset(data.activePreset);
    setActiveStatus(data.activeStatus);
    setFilters({
      batchId: data.batchId ?? "",
      expiry: data.expiry ?? "ANY",
      planId: data.planId ?? "",
      tagId: data.tagId ?? "",
    });
    setJoinedRange((data.joinedRange as JoinedRange) ?? "ALL");
    setSearch(data.search ?? "");
    setSort(data.sort ?? "RECENTLY_ADDED");
    setShowSavedViews(false);
  };

  const handleDeleteSavedView = async () => {
    if (!token || !viewToDelete) return;

    setIsSaving(true);
    try {
      await deleteSavedView(token, viewToDelete.id);
      setViewToDelete(null);
      await loadMetadata(token);
      setNotice("Saved view deleted.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to delete saved view.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell user={user}>
      <div className="grid gap-[var(--section-gap)]">
        <PageHeader
          actions={
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="size-[var(--icon-sm)]" />
              Add Member
            </Button>
          }
          description="Manage active clients and re-engage lapsed memberships."
          title="Members"
        />

        <Card className="overflow-hidden">
          <div className="flex min-h-12 gap-[var(--space-5)] overflow-x-auto px-[var(--space-4)]">
            {statusTabs.map((tab) => {
              const isActive =
                activeStatus === tab.status && activePreset === tab.preset;
              return (
                <button
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-2 border-transparent text-sm font-semibold text-[var(--color-text-secondary)]",
                    isActive && "border-[var(--color-primary)] text-[var(--color-primary)]",
                  )}
                  key={tab.label}
                  onClick={() => {
                    setActiveStatus(tab.status);
                    setActivePreset(tab.preset);
                  }}
                  type="button"
                >
                  {tab.label}
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", tab.tone)}>
                    {counts[tab.label] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col gap-[var(--space-3)] p-[var(--space-3)] xl:flex-row xl:items-center">
          <label className="relative h-[var(--control-height-md)] min-w-[16rem] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              className="h-full w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-11 pr-[var(--control-padding-x)] text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
              onChange={(event) => {
                setSearch(event.target.value);
                setActivePreset(undefined);
              }}
              placeholder="Search by name, phone or member ID"
              type="search"
              value={search}
            />
          </label>
          <div className="flex flex-wrap gap-[var(--space-3)]">
            <FilterSelect
              active={joinedRange !== "ALL"}
              icon={Calendar}
              label={joinedRangeOptions.find((option) => option.value === joinedRange)?.label ?? "All Time"}
              onChange={(event) => setJoinedRange(event.target.value as JoinedRange)}
              options={joinedRangeOptions}
              value={joinedRange}
            />
            <FilterSelect
              active={Boolean(filters.batchId)}
              icon={UsersRound}
              label={batches.find((batch) => batch.id === filters.batchId)?.name ?? "Batch"}
              onChange={(event) => {
                setFilters({ ...filters, batchId: event.target.value });
                setActivePreset(undefined);
              }}
              options={[
                { label: "All Batches", value: "" },
                ...batches.map((batch) => ({ label: batch.name, value: batch.id })),
              ]}
              value={filters.batchId}
            />
            <FilterSelect
              active={Boolean(filters.planId)}
              icon={Bookmark}
              label={plans.find((plan) => plan.id === filters.planId)?.name ?? "Membership Type"}
              onChange={(event) => {
                setFilters({ ...filters, planId: event.target.value });
                setActivePreset(undefined);
              }}
              options={[
                { label: "All Membership Types", value: "" },
                ...plans.map((plan) => ({ label: plan.name, value: plan.id })),
              ]}
              value={filters.planId}
            />
            <FilterSelect
              active={filters.expiry !== "ANY"}
              icon={CalendarDays}
              label={expiryOptions.find((option) => option.value === filters.expiry)?.label ?? "Expiry"}
              onChange={(event) => {
                setFilters({ ...filters, expiry: event.target.value as ExpiryFilter });
                setActivePreset(undefined);
              }}
              options={expiryOptions}
              value={filters.expiry}
            />
            <FilterButton
              activeCount={activeFilterCount}
              icon={Filter}
              onClick={() => setShowAdvancedFilters(true)}
            >
              More Filters
            </FilterButton>
            <FilterButton
              activeCount={savedViews.length}
              icon={Bookmark}
              onClick={() => setShowSavedViews(true)}
            >
              Saved Views
            </FilterButton>
          </div>
        </Card>

        <div className="flex flex-wrap gap-[var(--space-3)]">
          {presetFilters.map((preset) => (
            <button
              className={cn(
                "h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text-secondary)]",
                activePreset === preset.preset &&
                  "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
              )}
              key={preset.preset}
              onClick={() => {
                setActivePreset(preset.preset);
                setActiveStatus(undefined);
              }}
              type="button"
            >
              {preset.label}
            </button>
          ))}
          {activePreset ? (
            <button
              className="h-9 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
              onClick={() => setActivePreset(undefined)}
              type="button"
            >
              Clear preset
            </button>
          ) : null}
        </div>

        <TrendStrip icon={UserPlus} label="New members / month" values={newMemberTrend} />
        <TrendStrip icon={RefreshCw} label="Renewals / month" values={renewalTrend} />

        <div className="flex flex-col gap-[var(--space-3)] md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            {isLoading ? "Loading members..." : `${visibleMembers.length} members found`}
          </p>
          <div className="flex items-center gap-[var(--space-3)]">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              Sort by
            </span>
            <select
              className="h-[var(--control-height-md)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm font-semibold outline-none"
              onChange={(event) => {
                setSort(event.target.value as MemberSort);
                setActivePreset(undefined);
              }}
              value={sort}
            >
              <option value="RECENTLY_ADDED">Recently Added</option>
              <option value="EXPIRY_NEAREST">Expiry Nearest</option>
              <option value="EXPIRY_FARTHEST">Expiry Farthest</option>
              <option value="NAME_A_Z">Name A-Z</option>
              <option value="LAST_ATTENDANCE">Last Attendance</option>
              <option value="MEMBERSHIP_VALUE">Membership Value</option>
            </select>
          </div>
        </div>

        {notice ? (
          <Card className="border-[var(--color-success-border)] bg-[var(--color-success-surface)] p-[var(--space-4)] text-sm font-medium text-[var(--color-success)]">
            {notice}
          </Card>
        ) : null}

        {error ? (
          <Card className="border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-[var(--space-4)] text-sm font-medium text-[var(--color-danger)]">
            {error}
          </Card>
        ) : null}

        <MembersTable
          isLoading={isLoading}
          members={visibleMembers}
          membershipsByMemberId={currentMembershipByMemberId}
          onDelete={setMemberToDelete}
          onEdit={openEditDialog}
          onOpen={openMemberDetails}
          programNameByPlanId={programNameByPlanId}
        />
      </div>

      <MemberFormDialog
        form={memberForm}
        isOpen={memberDialogMode !== null}
        isSaving={isSaving}
        mode={memberDialogMode ?? "create"}
        onChange={setMemberForm}
        onClose={() => setMemberDialogMode(null)}
        onSave={handleSaveMember}
        batches={batches}
        membershipsByMemberId={currentMembershipByMemberId}
        plans={plans}
        tags={tags}
      />

      <AdvancedFiltersDialog
        filters={filters}
        isOpen={showAdvancedFilters}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setActivePreset(undefined);
          setShowAdvancedFilters(false);
        }}
        onClose={() => setShowAdvancedFilters(false)}
        batches={batches}
        plans={plans}
        tags={tags}
      />

      <SavedViewsDialog
        isOpen={showSavedViews}
        isSaving={isSaving}
        name={savedViewName}
        onApply={applySavedView}
        onClose={() => setShowSavedViews(false)}
        onDelete={setViewToDelete}
        onNameChange={setSavedViewName}
        onSave={handleSaveCurrentView}
        views={savedViews}
      />

      <MemberDetailDialog
        followUpForm={followUpForm}
        followUps={followUps}
        isOpen={Boolean(detailMember)}
        isSaving={isSaving}
        member={detailMember}
        onAddFollowUp={handleAddFollowUp}
        onClose={() => setDetailMember(null)}
        onDelete={(member) => setMemberToDelete(member)}
        onEdit={openEditDialog}
        onFollowUpChange={setFollowUpForm}
        onCancelMembership={handleCancelMembership}
        onToggleTag={handleToggleTag}
        membership={detailMember ? currentMembershipByMemberId[detailMember.id] : undefined}
        programNameByPlanId={programNameByPlanId}
        tags={tags}
      />

      <ConfirmDialog
        isOpen={Boolean(memberToDelete)}
        isSaving={isSaving}
        message={`Delete ${memberToDelete?.name ?? "this member"}? This cannot be undone.`}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDeleteMember}
        title="Delete Member"
      />

      <ConfirmDialog
        isOpen={Boolean(viewToDelete)}
        isSaving={isSaving}
        message={`Delete saved view "${viewToDelete?.name ?? ""}"?`}
        onClose={() => setViewToDelete(null)}
        onConfirm={handleDeleteSavedView}
        title="Delete Saved View"
      />
    </AppShell>
  );
}

function TrendStrip({
  icon: Icon,
  label,
  values,
}: {
  icon: typeof UserPlus;
  label: string;
  values: Array<[string, number]>;
}) {
  return (
    <Card className="grid min-h-16 grid-cols-[14rem_1fr_2rem] items-center overflow-hidden px-[var(--space-4)]">
      <div className="flex items-center gap-[var(--space-3)] border-r border-[var(--color-divider)]">
        <Icon className="size-[var(--icon-md)] text-[var(--color-primary)]" />
        <p className="text-sm font-bold text-[var(--color-text)]">{label}</p>
      </div>
      <div className="grid grid-cols-2 gap-[var(--space-3)] px-[var(--space-5)] md:grid-cols-3 xl:grid-cols-6">
        {values.map(([month, value]) => (
          <div key={month}>
            <p className="text-xs font-medium text-[var(--color-text-muted)]">{month}</p>
            <p className="mt-1 text-base font-bold text-[var(--color-text)]">{value}</p>
          </div>
        ))}
      </div>
      <ChevronDown className="size-[var(--icon-sm)] text-[var(--color-text-muted)]" />
    </Card>
  );
}

function MembersTable({
  isLoading,
  members,
  membershipsByMemberId,
  onDelete,
  onEdit,
  onOpen,
  programNameByPlanId,
}: {
  isLoading: boolean;
  members: Member[];
  membershipsByMemberId: Record<string, Membership>;
  onDelete: (member: Member) => void;
  onEdit: (member: Member) => void;
  onOpen: (member: Member) => void;
  programNameByPlanId: Record<string, string>;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
          <thead className="h-[var(--table-header-height)] bg-[var(--table-header-background)] text-xs font-bold text-[var(--color-text)]">
            <tr>
              <th className="w-12 px-[var(--table-cell-padding-x)]">
                <input aria-label="Select all members" type="checkbox" />
              </th>
              {["Member", "Plan", "Program", "Batch", "Expiry", "Grace Window", "Tags", "Follow-up", "Status", "Actions"].map((heading) => (
                <th className="px-[var(--table-cell-padding-x)]" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-divider)]">
            {isLoading ? (
              <TableMessage message="Loading members..." />
            ) : members.length === 0 ? (
              <TableMessage message="No members found." />
            ) : (
              members.map((member) => {
                const membership = membershipsByMemberId[member.id];
                return (
                <tr
                  className="h-[var(--table-row-height)] hover:bg-[var(--table-row-hover)]"
                  key={member.id}
                >
                  <td className="px-[var(--table-cell-padding-x)]">
                    <input aria-label={`Select ${member.name}`} type="checkbox" />
                  </td>
                  <td className="px-[var(--table-cell-padding-x)]">
                    <button
                      className="flex items-center gap-[var(--space-3)] text-left"
                      onClick={() => onOpen(member)}
                      type="button"
                    >
                      <Avatar name={member.name} />
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">{member.name}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{member.phone}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text)]">{membership?.plan?.name ?? "—"}</td>
                  <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text)]">{membership?.planId ? programNameByPlanId[membership.planId] ?? "—" : "—"}</td>
                  <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text-secondary)]">{membership?.batch?.name ?? "—"}</td>
                  <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text-secondary)]">{formatDate(membership?.endDate)}</td>
                  <td className="px-[var(--table-cell-padding-x)]">
                    <Tags tags={member.tags ?? []} />
                  </td>
                  <td className="px-[var(--table-cell-padding-x)]">
                    <button
                      className="rounded-[var(--radius-full)] bg-[var(--color-info-surface)] px-3 py-1 text-xs font-bold text-[var(--color-info)]"
                      onClick={() => onOpen(member)}
                      type="button"
                    >
                      Follow-up
                    </button>
                  </td>
                  <td className="px-[var(--table-cell-padding-x)]">
                    <StatusBadge status={statusTone(member.status)}>
                      {formatMemberStatus(member.status)}
                    </StatusBadge>
                  </td>
                  <td className="px-[var(--table-cell-padding-x)]">
                    <div className="flex items-center gap-1">
                      <button
                        aria-label={`Edit ${member.name}`}
                        className="grid size-8 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
                        onClick={() => onEdit(member)}
                        type="button"
                      >
                        <MoreVertical className="size-[var(--icon-sm)]" />
                      </button>
                      <button
                        className="rounded-[var(--radius-md)] px-2 py-1 text-xs font-bold text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)]"
                        onClick={() => onDelete(member)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MemberFormDialog({
  batches,
  form,
  isOpen,
  isSaving,
  membershipsByMemberId,
  mode,
  onChange,
  onClose,
  onSave,
  plans,
  tags,
}: {
  batches: Batch[];
  form: MemberFormState;
  isOpen: boolean;
  isSaving: boolean;
  membershipsByMemberId: Record<string, Membership>;
  mode: "create" | "edit";
  onChange: (form: MemberFormState) => void;
  onClose: () => void;
  onSave: () => void;
  plans: Plan[];
  tags: Tag[];
}) {
  const selectedPlan = plans.find((plan) => plan.id === form.planId);

  return (
    <Dialog
      className="max-w-3xl"
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Add Member" : "Edit Member"}
    >
      <div className="grid gap-[var(--space-4)]">
        <div className="grid gap-[var(--space-4)] md:grid-cols-2">
          <Field label="Full name">
            <Input
              onChange={(event) => onChange({ ...form, name: event.target.value })}
              placeholder="Sneha Kapoor"
              value={form.name}
            />
          </Field>
          <Field label="Phone">
            <Input
              onChange={(event) => onChange({ ...form, phone: event.target.value })}
              placeholder="+919820011234"
              value={form.phone}
            />
          </Field>
          <Field label="Email">
            <Input
              onChange={(event) => onChange({ ...form, email: event.target.value })}
              placeholder="member@email.com"
              type="email"
              value={form.email}
            />
          </Field>
          <Field label="Date of birth">
            <Input
              onChange={(event) => onChange({ ...form, dob: event.target.value })}
              type="date"
              value={form.dob}
            />
          </Field>
          <Field label="Emergency contact">
            <Input
              onChange={(event) => onChange({ ...form, emergencyContactName: event.target.value })}
              placeholder="Contact name"
              value={form.emergencyContactName}
            />
          </Field>
          <Field label="Emergency phone">
            <Input
              onChange={(event) => onChange({ ...form, emergencyContactNumber: event.target.value })}
              placeholder="+919800000000"
              value={form.emergencyContactNumber}
            />
          </Field>
          {mode === "edit" ? (
            <Field label="Status">
              <select
                className="h-[var(--control-height-md)] w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
                onChange={(event) => onChange({ ...form, status: event.target.value as MemberStatus })}
                value={form.status}
              >
                {["PENDING_ACTIVATION", "ACTIVE", "EXPIRING_SOON", "FROZEN", "INACTIVE", "LOST_DECLINE"].map((status) => (
                  <option key={status} value={status}>{formatMemberStatus(status as MemberStatus)}</option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Tags">
            <select
              className="h-[var(--control-height-md)] w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                const tagIds = new Set(form.tagIds ?? []);
                tagIds.add(value);
                onChange({ ...form, tagIds: Array.from(tagIds) });
              }}
              value=""
            >
              <option value="">Add tag</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Card className="grid gap-[var(--space-4)] p-[var(--space-4)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text)]">Membership</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Assign plan, batch, dates and price for the current membership.
            </p>
          </div>
          <div className="grid gap-[var(--space-4)] md:grid-cols-2">
            <Field label="Membership type">
              <select
                className="h-[var(--control-height-md)] w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
                onChange={(event) => {
                  const plan = plans.find((item) => item.id === event.target.value);
                  onChange({
                    ...form,
                    planActualPrice: plan ? String(plan.price) : form.planActualPrice,
                    planId: event.target.value,
                    purchasePrice: plan ? String(plan.price) : form.purchasePrice,
                  });
                }}
                value={form.planId}
              >
                <option value="">Select membership type</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Batch">
              <select
                className="h-[var(--control-height-md)] w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
                onChange={(event) => onChange({ ...form, batchId: event.target.value })}
                value={form.batchId}
              >
                <option value="">No batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Invoice date">
              <Input
                onChange={(event) => onChange({ ...form, invoiceDate: event.target.value })}
                type="date"
                value={form.invoiceDate}
              />
            </Field>
            <Field label="Start date">
              <Input
                onChange={(event) => onChange({ ...form, startDate: event.target.value })}
                type="date"
                value={form.startDate}
              />
            </Field>
            <Field label="Expiry date">
              <Input
                onChange={(event) => onChange({ ...form, endDate: event.target.value })}
                type="date"
                value={form.endDate}
              />
            </Field>
            <Field label="Purchase price">
              <Input
                onChange={(event) => onChange({ ...form, purchasePrice: event.target.value })}
                placeholder={selectedPlan ? String(selectedPlan.price) : "3650"}
                type="number"
                value={form.purchasePrice}
              />
            </Field>
          </div>
          {mode === "edit" && Object.keys(membershipsByMemberId).length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No current memberships loaded yet.</p>
          ) : null}
        </Card>
        <Field label="Address">
          <textarea
            className="min-h-24 w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
            onChange={(event) => onChange({ ...form, address: event.target.value })}
            placeholder="Address"
            value={form.address}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          {(form.tagIds ?? []).map((tagId) => {
            const tag = tags.find((item) => item.id === tagId);
            return (
              <button
                className="rounded-[var(--radius-full)] bg-[var(--color-success-surface)] px-3 py-1 text-xs font-bold text-[var(--color-success)]"
                key={tagId}
                onClick={() => onChange({ ...form, tagIds: form.tagIds?.filter((id) => id !== tagId) })}
                type="button"
              >
                {tag?.name ?? tagId} ×
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-[var(--space-3)]">
          <Button onClick={onClose} type="button" variant="secondary">Cancel</Button>
          <Button disabled={isSaving || !form.name || !form.phone} onClick={onSave} type="button">
            {isSaving ? "Saving..." : "Save Member"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function AdvancedFiltersDialog({
  batches,
  filters,
  isOpen,
  onApply,
  onClose,
  plans,
  tags,
}: {
  batches: Batch[];
  filters: AdvancedFilters;
  isOpen: boolean;
  onApply: (filters: AdvancedFilters) => void;
  onClose: () => void;
  plans: Plan[];
  tags: Tag[];
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters, isOpen]);

  return (
    <Dialog className="max-w-2xl" isOpen={isOpen} onClose={onClose} title="Member Filters">
      <div className="grid gap-[var(--space-4)] md:grid-cols-2">
        <Field label="Batch">
          <select
            className="h-[var(--control-height-md)] w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
            onChange={(event) => setDraft({ ...draft, batchId: event.target.value })}
            value={draft.batchId}
          >
            <option value="">All batches</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Membership type">
          <select
            className="h-[var(--control-height-md)] w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
            onChange={(event) => setDraft({ ...draft, planId: event.target.value })}
            value={draft.planId}
          >
            <option value="">All membership types</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tag">
          <select
            className="h-[var(--control-height-md)] w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
            onChange={(event) => setDraft({ ...draft, tagId: event.target.value })}
            value={draft.tagId}
          >
            <option value="">Any tag</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Expiry">
          <select
            className="h-[var(--control-height-md)] w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
            onChange={(event) => setDraft({ ...draft, expiry: event.target.value as ExpiryFilter })}
            value={draft.expiry}
          >
            <option value="ANY">Any</option>
            <option value="EXPIRING_TODAY">Expiring today</option>
            <option value="EXPIRING_IN_3_DAYS">Expiring in 3 days</option>
            <option value="EXPIRING_IN_7_DAYS">Expiring in 7 days</option>
            <option value="EXPIRING_IN_15_DAYS">Expiring in 15 days</option>
            <option value="EXPIRING_IN_30_DAYS">Expiring in 30 days</option>
            <option value="ALREADY_EXPIRED">Already expired</option>
          </select>
        </Field>
        <div className="flex justify-end gap-[var(--space-3)] md:col-span-2">
          <Button onClick={() => onApply({ batchId: "", expiry: "ANY", planId: "", tagId: "" })} type="button" variant="secondary">
            Clear
          </Button>
          <Button onClick={() => onApply(draft)} type="button">Apply Filters</Button>
        </div>
      </div>
    </Dialog>
  );
}

function SavedViewsDialog({
  isOpen,
  isSaving,
  name,
  onApply,
  onClose,
  onDelete,
  onNameChange,
  onSave,
  views,
}: {
  isOpen: boolean;
  isSaving: boolean;
  name: string;
  onApply: (view: SavedView) => void;
  onClose: () => void;
  onDelete: (view: SavedView) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  views: SavedView[];
}) {
  return (
    <Dialog className="max-w-2xl" isOpen={isOpen} onClose={onClose} title="Saved Views">
      <div className="grid gap-[var(--space-4)]">
        <div className="flex gap-[var(--space-3)]">
          <Input
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="View name"
            value={name}
          />
          <Button disabled={isSaving || !name.trim()} onClick={onSave} type="button">
            Save
          </Button>
        </div>
        <div className="divide-y divide-[var(--color-divider)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
          {views.length === 0 ? (
            <p className="p-[var(--space-4)] text-sm text-[var(--color-text-muted)]">No saved views yet.</p>
          ) : (
            views.map((view) => (
              <div className="flex items-center justify-between gap-[var(--space-3)] p-[var(--space-3)]" key={view.id}>
                <button className="text-left" onClick={() => onApply(view)} type="button">
                  <p className="font-semibold text-[var(--color-text)]">{view.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(view.createdAt)}</p>
                </button>
                <Button onClick={() => onDelete(view)} type="button" variant="secondary">
                  Delete
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}

function MemberDetailDialog({
  followUpForm,
  followUps,
  isOpen,
  isSaving,
  member,
  membership,
  onAddFollowUp,
  onCancelMembership,
  onClose,
  onDelete,
  onEdit,
  onFollowUpChange,
  onToggleTag,
  programNameByPlanId,
  tags,
}: {
  followUpForm: { note: string; outcome: FollowUpOutcome; scheduledAt: string };
  followUps: MemberFollowUp[];
  isOpen: boolean;
  isSaving: boolean;
  member: Member | null;
  membership?: Membership;
  onAddFollowUp: () => void;
  onCancelMembership: (membership: Membership) => void;
  onClose: () => void;
  onDelete: (member: Member) => void;
  onEdit: (member: Member) => void;
  onFollowUpChange: (form: { note: string; outcome: FollowUpOutcome; scheduledAt: string }) => void;
  onToggleTag: (tag: Tag) => void;
  programNameByPlanId: Record<string, string>;
  tags: Tag[];
}) {
  if (!member) return null;

  return (
    <Dialog className="max-w-4xl" isOpen={isOpen} onClose={onClose} title={member.name}>
      <div className="grid gap-[var(--space-5)] lg:grid-cols-[1fr_1.1fr]">
        <Card className="p-[var(--space-4)]">
          <div className="flex items-start justify-between gap-[var(--space-4)]">
            <div className="flex items-center gap-[var(--space-3)]">
              <Avatar name={member.name} />
              <div>
                <p className="font-bold text-[var(--color-text)]">{member.name}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{member.phone}</p>
              </div>
            </div>
            <StatusBadge status={statusTone(member.status)}>
              {formatMemberStatus(member.status)}
            </StatusBadge>
          </div>
          <div className="mt-[var(--space-5)] grid gap-3 text-sm">
            <DetailRow label="Email" value={member.email ?? "—"} />
            <DetailRow label="DOB" value={formatDate(member.dob)} />
            <DetailRow label="Joined" value={formatDate(member.joinedOn)} />
            <DetailRow label="Emergency" value={member.emergencyContactName || member.emergencyContactNumber ? `${member.emergencyContactName ?? ""} ${member.emergencyContactNumber ?? ""}`.trim() : "—"} />
            <DetailRow label="Address" value={member.address ?? "—"} />
          </div>
          <div className="mt-[var(--space-5)] flex gap-[var(--space-3)]">
            <Button onClick={() => onEdit(member)} type="button">Edit</Button>
            <Button onClick={() => onDelete(member)} type="button" variant="secondary">
              Delete
            </Button>
          </div>
        </Card>

        <div className="grid gap-[var(--space-4)]">
          <Card className="p-[var(--space-4)]">
            <h3 className="font-bold text-[var(--color-text)]">Membership</h3>
            {membership ? (
              <div className="mt-[var(--space-3)] grid gap-3 text-sm">
                <DetailRow label="Plan" value={membership.plan?.name ?? membership.planId} />
                <DetailRow label="Program" value={programNameByPlanId[membership.planId] ?? "—"} />
                <DetailRow label="Batch" value={membership.batch?.name ?? membership.batchId ?? "—"} />
                <DetailRow label="Start" value={formatDate(membership.startDate)} />
                <DetailRow label="Expiry" value={formatDate(membership.endDate)} />
                <DetailRow label="Price" value={`₹${Number(membership.purchasePrice).toLocaleString("en-IN")}`} />
                <DetailRow label="Status" value={formatMemberStatus(membership.status)} />
                {membership.status === "ACTIVE" ? (
                  <Button
                    className="mt-2 w-fit"
                    disabled={isSaving}
                    onClick={() => onCancelMembership(membership)}
                    type="button"
                    variant="secondary"
                  >
                    Cancel Membership
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="mt-[var(--space-3)] text-sm text-[var(--color-text-muted)]">
                No membership assigned yet. Use Edit to assign a plan and batch.
              </p>
            )}
          </Card>

          <Card className="p-[var(--space-4)]">
            <div className="mb-[var(--space-3)] flex items-center gap-2">
              <TagIcon className="size-[var(--icon-sm)] text-[var(--color-primary)]" />
              <h3 className="font-bold text-[var(--color-text)]">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No tags available from backend.</p>
              ) : (
                tags.map((tag) => {
                  const active = member.tags?.some((memberTag) => memberTag.tagId === tag.id);
                  return (
                    <button
                      className={cn(
                        "rounded-[var(--radius-full)] border border-[var(--color-border)] px-3 py-1 text-xs font-bold",
                        active
                          ? "border-[var(--color-success-border)] bg-[var(--color-success-surface)] text-[var(--color-success)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]",
                      )}
                      disabled={isSaving}
                      key={tag.id}
                      onClick={() => onToggleTag(tag)}
                      type="button"
                    >
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="p-[var(--space-4)]">
            <h3 className="font-bold text-[var(--color-text)]">Follow-ups</h3>
            <div className="mt-[var(--space-3)] grid gap-[var(--space-3)] md:grid-cols-[1fr_10rem]">
              <Input
                onChange={(event) => onFollowUpChange({ ...followUpForm, scheduledAt: event.target.value })}
                type="datetime-local"
                value={followUpForm.scheduledAt}
              />
              <select
                className="h-[var(--control-height-md)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
                onChange={(event) => onFollowUpChange({ ...followUpForm, outcome: event.target.value as FollowUpOutcome })}
                value={followUpForm.outcome}
              >
                <option value="PENDING">Pending</option>
                <option value="DONE">Done</option>
                <option value="UNREACHABLE">Unreachable</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
              <textarea
                className="min-h-20 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)] md:col-span-2"
                onChange={(event) => onFollowUpChange({ ...followUpForm, note: event.target.value })}
                placeholder="Follow-up note"
                value={followUpForm.note}
              />
              <Button
                className="md:col-span-2"
                disabled={isSaving || !followUpForm.scheduledAt}
                onClick={onAddFollowUp}
                type="button"
              >
                Add Follow-up
              </Button>
            </div>
            <div className="mt-[var(--space-4)] divide-y divide-[var(--color-divider)]">
              {followUps.length === 0 ? (
                <p className="py-3 text-sm text-[var(--color-text-muted)]">No follow-ups yet.</p>
              ) : (
                followUps.map((followUp) => (
                  <div className="grid gap-1 py-3" key={followUp.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{formatDateTime(followUp.scheduledAt)}</p>
                      <StatusBadge status={followUp.outcome === "DONE" ? "active" : "pending"}>
                        {formatMemberStatus(followUp.outcome as unknown as MemberStatus)}
                      </StatusBadge>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{followUp.note || "No note"}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </Dialog>
  );
}

function ConfirmDialog({
  isOpen,
  isSaving,
  message,
  onClose,
  onConfirm,
  title,
}: {
  isOpen: boolean;
  isSaving: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <Dialog className="max-w-md" isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      <div className="mt-[var(--space-5)] flex justify-end gap-[var(--space-3)]">
        <Button onClick={onClose} type="button" variant="secondary">Cancel</Button>
        <Button disabled={isSaving} onClick={onConfirm} type="button">
          {isSaving ? "Working..." : "Confirm"}
        </Button>
      </div>
    </Dialog>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
      {label}
      {children}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3">
      <span className="font-semibold text-[var(--color-text-muted)]">{label}</span>
      <span className="text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function TableMessage({ message }: { message: string }) {
  return (
    <tr>
      <td className="h-32 px-[var(--table-cell-padding-x)] text-center text-[var(--color-text-muted)]" colSpan={11}>
        {message}
      </td>
    </tr>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="grid size-9 place-items-center rounded-[var(--radius-full)] bg-[var(--color-primary-subtle)] text-xs font-bold text-[var(--color-primary)]">
      {name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")}
    </div>
  );
}

function Tags({ tags }: { tags: Member["tags"] }) {
  const displayTags = tags?.filter((tag) => tag.tag?.name).slice(0, 2) ?? [];
  if (displayTags.length === 0) return <span className="text-[var(--color-text-muted)]">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map((tag) => (
        <span
          className="rounded-[var(--radius-full)] bg-[var(--color-success-surface)] px-2 py-1 text-xs font-bold text-[var(--color-success)]"
          key={tag.tagId}
        >
          {tag.tag?.name}
        </span>
      ))}
    </div>
  );
}

function splitMemberForm(form: MemberFormState): {
  memberPayload: UpdateMemberPayload;
  membershipPayload?: {
    batchId?: string;
    endDate: string;
    invoiceDate: string;
    planActualPrice: number;
    planId: string;
    purchasePrice: number;
    startDate: string;
  };
} {
  const {
    batchId,
    endDate,
    invoiceDate,
    planActualPrice,
    planId,
    purchasePrice,
    startDate,
    ...memberFields
  } = form;

  const memberPayload = Object.fromEntries(
    Object.entries(memberFields).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== "";
    }),
  ) as UpdateMemberPayload;

  const hasMembership = Boolean(planId && startDate && endDate);
  const normalizedPurchasePrice = Number(purchasePrice || planActualPrice || 0);

  return {
    memberPayload,
    membershipPayload: hasMembership && planId && startDate && endDate
      ? {
          batchId: batchId || undefined,
          endDate,
          invoiceDate: invoiceDate || startDate,
          planActualPrice: Number(planActualPrice || normalizedPurchasePrice),
          planId,
          purchasePrice: normalizedPurchasePrice,
          startDate,
        }
      : undefined,
  };
}

function statusTone(status: MemberStatus) {
  if (status === "ACTIVE") return "active";
  if (status === "FROZEN") return "trial";
  if (status === "INACTIVE" || status === "LOST_DECLINE") return "lost";
  return "pending";
}

function formatMemberStatus(status: string) {
  return status
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
}

function dateOnly(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function isInJoinedRange(value: string, range: JoinedRange) {
  if (range === "ALL") return true;

  const joined = new Date(value);
  if (Number.isNaN(joined.getTime())) return true;

  const now = new Date();
  if (range === "LAST_30_DAYS") {
    return joined >= new Date(now.getTime() - 30 * 86400000);
  }

  if (range === "THIS_MONTH") {
    return joined.getFullYear() === now.getFullYear() && joined.getMonth() === now.getMonth();
  }

  return joined.getFullYear() === now.getFullYear();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
