"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Calendar,
  ChevronDown,
  Filter,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FilterButton } from "@/components/ui/filter-button";
import { FilterSelect } from "@/components/ui/filter-select";
import { InitialAvatar } from "@/components/ui/initial-avatar";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { getBatches, type Batch } from "@/lib/api/batches";
import {
  addLeadFollowUp,
  convertLeadToMember,
  createLead,
  deleteLead,
  getLead,
  getLeadFollowUps,
  getLeads,
  markLeadLost,
  reEngageLead,
  updateLead,
  type BatchTypePref,
  type CreateLeadPayload,
  type FollowUpOutcome,
  type Lead,
  type LeadFollowUp,
  type LeadSource,
  type LeadStage,
  type LeadStatus,
  type UpdateLeadPayload,
} from "@/lib/api/leads";
import { getPrograms, type Program } from "@/lib/api/programs";
import { getStaff, type Staff } from "@/lib/api/staff";
import type { AuthUser } from "@/lib/api/auth";
import { getAccessToken, getStoredUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type LeadGroup = "OVERDUE" | "TODAY" | "UPCOMING";
type AvatarTone = "blue" | "green" | "orange" | "purple" | "red" | "teal";
type CreatedRange = "ALL" | "TODAY" | "LAST_7" | "THIS_MONTH";

type LeadFormState = CreateLeadPayload & {
  stage?: LeadStage;
  status?: LeadStatus;
};

const emptyLeadForm: LeadFormState = {
  assignedStaffId: "",
  batchTypePref: "GROUP_BATCH",
  dob: "",
  name: "",
  nextFollowUpAt: "",
  phone: "",
  preferredBatchId: "",
  programIds: [],
  remark: "",
  source: "WHATSAPP_INQUIRY",
  stage: "ENQUIRY",
  status: "NEW",
};

const sourceOptions: Array<{ label: string; value: LeadSource | "" }> = [
  { label: "All Sources", value: "" },
  { label: "WhatsApp Inquiry", value: "WHATSAPP_INQUIRY" },
  { label: "Walk-in", value: "WALK_IN" },
  { label: "Referral", value: "REFERRAL" },
  { label: "Instagram Ads", value: "INSTAGRAM_ADS" },
  { label: "Facebook Ads", value: "FACEBOOK_ADS" },
  { label: "Google Ads", value: "GOOGLE_ADS" },
  { label: "Website", value: "WEBSITE" },
  { label: "Other", value: "OTHER" },
];

const createdOptions: Array<{ label: string; value: CreatedRange }> = [
  { label: "All Time", value: "ALL" },
  { label: "Today", value: "TODAY" },
  { label: "Last 7 Days", value: "LAST_7" },
  { label: "This Month", value: "THIS_MONTH" },
];

const statusOptions: Array<{ label: string; value: LeadStatus | "" }> = [
  { label: "All Status", value: "" },
  { label: "New", value: "NEW" },
  { label: "Lead Follow-up", value: "LEAD_FOLLOW_UP" },
  { label: "Unreachable", value: "LEAD_UNREACHABLE" },
];

const stageTabs: Array<{ label: string; stage: LeadStage }> = [
  { label: "Enquiries", stage: "ENQUIRY" },
  { label: "Trial Handling", stage: "TRIAL_SCHEDULED" },
  { label: "Lost/Declined", stage: "LOST_DECLINE" },
];

const groupMeta: Record<LeadGroup, { label: string; tone: string }> = {
  OVERDUE: {
    label: "Overdue",
    tone: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
  },
  TODAY: {
    label: "Today",
    tone: "bg-[var(--color-info-surface)] text-[var(--color-primary)]",
  },
  UPCOMING: {
    label: "Upcoming",
    tone: "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
  },
};

export function LeadsScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [activeStage, setActiveStage] = useState<LeadStage>("ENQUIRY");
  const [search, setSearch] = useState("");
  const [created, setCreated] = useState<CreatedRange>("ALL");
  const [source, setSource] = useState<LeadSource | "">("");
  const [programId, setProgramId] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [batchId, setBatchId] = useState("");
  const [sort, setSort] = useState("FOLLOW_UP_DATE");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [leadForm, setLeadForm] = useState<LeadFormState>(emptyLeadForm);
  const [leadDialogMode, setLeadDialogMode] = useState<"create" | "edit" | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [followUpForm, setFollowUpForm] = useState({
    note: "",
    outcome: "PENDING" as FollowUpOutcome,
    scheduledAt: "",
  });
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [lostRemark, setLostRemark] = useState("");

  const loadMetadata = useCallback(async (accessToken: string) => {
    const [programData, batchData, staffData] = await Promise.all([
      getPrograms(accessToken),
      getBatches(accessToken),
      getStaff(accessToken),
    ]);
    setPrograms(programData);
    setBatches(batchData);
    setStaff(staffData);
  }, []);

  const loadLeads = useCallback(
    async (accessToken = token) => {
      if (!accessToken) return;

      setIsLoading(true);
      try {
        const query = {
          programId,
          search,
          source: source || undefined,
          status: status || undefined,
        };
        const [data, countData] = await Promise.all([
          getLeads(accessToken, { ...query, stage: activeStage }),
          getLeads(accessToken, query),
        ]);
        setLeads(sortLeads(data, sort));
        setAllLeads(countData);
        setError("");
      } catch (apiError) {
        setError(apiError instanceof Error ? apiError.message : "Unable to load leads.");
      } finally {
        setIsLoading(false);
      }
    },
    [activeStage, programId, search, sort, source, status, token],
  );

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    setToken(accessToken);
    setUser(getStoredUser());
    loadMetadata(accessToken).catch((apiError) => {
      setError(apiError instanceof Error ? apiError.message : "Unable to load lead metadata.");
    });
  }, [loadMetadata]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadLeads();
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [loadLeads]);

  const visibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesBatch = batchId ? lead.preferredBatchId === batchId : true;
      return matchesBatch && isInCreatedRange(lead.createdAt, created);
    });
  }, [batchId, created, leads]);

  const stageCounts = useMemo(() => {
    return stageTabs.reduce<Record<LeadStage, number>>((acc, tab) => {
      acc[tab.stage] = allLeads.filter((lead) => lead.stage === tab.stage).length;
      return acc;
    }, {} as Record<LeadStage, number>);
  }, [allLeads]);

  const overdueCount = visibleLeads.filter((lead) => groupLead(lead) === "OVERDUE").length;

  const openCreateDialog = () => {
    setSelectedLead(null);
    setLeadForm(emptyLeadForm);
    setLeadDialogMode("create");
  };

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadForm({
      assignedStaffId: lead.assignedStaffId ?? "",
      batchTypePref: lead.batchTypePref,
      dob: dateOnly(lead.dob),
      name: lead.name,
      nextFollowUpAt: toDateTimeLocal(lead.nextFollowUpAt),
      phone: lead.phone,
      preferredBatchId: lead.preferredBatchId ?? "",
      programIds: lead.interests?.map((interest) => interest.programId) ?? [],
      remark: lead.remark ?? "",
      source: lead.source,
      stage: lead.stage,
      status: lead.status,
    });
    setLeadDialogMode("edit");
  };

  const saveLead = async () => {
    if (!token) return;

    setIsSaving(true);
    setNotice("");
    try {
      const payload = cleanLeadPayload(leadForm);
      if (leadDialogMode === "edit" && selectedLead) {
        await updateLead(token, selectedLead.id, payload as UpdateLeadPayload);
        setNotice("Lead updated.");
      } else {
        await createLead(token, payload as CreateLeadPayload);
        setNotice("Lead created.");
      }
      setLeadDialogMode(null);
      await loadLeads();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to save lead.");
    } finally {
      setIsSaving(false);
    }
  };

  const openLeadDetails = async (lead: Lead) => {
    if (!token) return;

    setSelectedLead(lead);
    setDetailLead(lead);
    setFollowUps([]);
    try {
      const [freshLead, leadFollowUps] = await Promise.all([
        getLead(token, lead.id),
        getLeadFollowUps(token, lead.id),
      ]);
      setDetailLead(freshLead);
      setFollowUps(leadFollowUps);
      setError("");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to load lead details.");
    }
  };

  const reloadLeadDetails = async (leadId: string) => {
    if (!token) return;
    const [freshLead, leadFollowUps] = await Promise.all([
      getLead(token, leadId),
      getLeadFollowUps(token, leadId),
    ]);
    setDetailLead(freshLead);
    setFollowUps(leadFollowUps);
    await loadLeads();
  };

  const addFollowUp = async () => {
    if (!token || !detailLead || !followUpForm.scheduledAt) return;

    setIsSaving(true);
    try {
      await addLeadFollowUp(token, detailLead.id, {
        note: followUpForm.note.trim() || undefined,
        outcome: followUpForm.outcome,
        scheduledAt: new Date(followUpForm.scheduledAt).toISOString(),
      });
      setFollowUpForm({ note: "", outcome: "PENDING", scheduledAt: "" });
      await reloadLeadDetails(detailLead.id);
      setNotice("Follow-up added.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to add follow-up.");
    } finally {
      setIsSaving(false);
    }
  };

  const markLost = async () => {
    if (!token || !detailLead) return;

    setIsSaving(true);
    try {
      await markLeadLost(token, detailLead.id, lostRemark || undefined);
      setLostRemark("");
      await reloadLeadDetails(detailLead.id);
      setNotice("Lead marked lost.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to mark lead lost.");
    } finally {
      setIsSaving(false);
    }
  };

  const reEngage = async () => {
    if (!token || !detailLead) return;

    setIsSaving(true);
    try {
      await reEngageLead(token, detailLead.id);
      await reloadLeadDetails(detailLead.id);
      setNotice("Lead re-engaged.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to re-engage lead.");
    } finally {
      setIsSaving(false);
    }
  };

  const convertLead = async () => {
    if (!token || !detailLead) return;

    setIsSaving(true);
    try {
      await convertLeadToMember(token, detailLead.id, {
        email: `${detailLead.name.toLowerCase().replace(/\s+/g, ".")}@evolve.test`,
      });
      setDetailLead(null);
      await loadLeads();
      setNotice("Lead converted to member.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to convert lead.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeLead = async () => {
    if (!token || !leadToDelete) return;

    setIsSaving(true);
    try {
      await deleteLead(token, leadToDelete.id);
      setLeadToDelete(null);
      setDetailLead(null);
      await loadLeads();
      setNotice("Lead deleted.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to delete lead.");
    } finally {
      setIsSaving(false);
    }
  };

  function clearFilters() {
    setCreated("ALL");
    setSource("");
    setProgramId("");
    setStatus("");
    setBatchId("");
    setSearch("");
  }

  return (
    <AppShell user={user}>
      <div className="grid gap-[var(--section-gap)]">
        <PageTop
          onNewLead={openCreateDialog}
          onSearchChange={setSearch}
          search={search}
        />

        <Card className="overflow-hidden rounded-none border-x-0 border-t-0 shadow-none">
          <div className="flex min-h-13 gap-[var(--space-6)] overflow-x-auto px-[var(--space-2)]">
            {stageTabs.map((tab) => {
              const isActive = activeStage === tab.stage;
              return (
                <button
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-2 border-transparent px-2 text-sm font-bold text-[var(--color-text)]",
                    isActive && "border-[var(--color-primary)] text-[var(--color-primary)]",
                  )}
                  key={tab.stage}
                  onClick={() => setActiveStage(tab.stage)}
                  type="button"
                >
                  {tab.label}
                  <span className="rounded-[var(--radius-full)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
                    {stageCounts[tab.stage] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-[var(--space-3)] border-b border-[var(--color-divider)] pb-[var(--space-4)] xl:flex-row xl:items-center">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Created on
          </span>
          <FilterSelect
            active={created !== "ALL"}
            icon={Calendar}
            label={createdOptions.find((option) => option.value === created)?.label ?? "All Time"}
            onChange={(event) => setCreated(event.target.value as CreatedRange)}
            options={createdOptions}
            value={created}
          />
          <div className="hidden h-6 w-px bg-[var(--color-divider)] xl:block" />
          <FilterSelect
            active={Boolean(source)}
            label={source ? formatEnum(source) : "Source"}
            onChange={(event) => setSource(event.target.value as LeadSource | "")}
            options={sourceOptions}
            value={source}
          />
          <FilterSelect
            active={Boolean(programId)}
            label={programs.find((program) => program.id === programId)?.name ?? "Interest"}
            onChange={(event) => setProgramId(event.target.value)}
            options={[
              { label: "All Interests", value: "" },
              ...programs.map((program) => ({ label: program.name, value: program.id })),
            ]}
            value={programId}
          />
          <FilterSelect
            active={Boolean(status)}
            label={status ? formatLeadStatus(status) : "Status"}
            onChange={(event) => setStatus(event.target.value as LeadStatus | "")}
            options={statusOptions}
            value={status}
          />
          <FilterSelect
            active={Boolean(batchId)}
            label={batches.find((batch) => batch.id === batchId)?.name ?? "Batch Time"}
            onChange={(event) => setBatchId(event.target.value)}
            options={[
              { label: "All Batch Times", value: "" },
              ...batches.map((batch) => ({ label: batch.name, value: batch.id })),
            ]}
            value={batchId}
          />
          <div className="ml-auto flex flex-wrap gap-[var(--space-3)]">
            <FilterButton icon={Filter}>More Filters</FilterButton>
            <FilterButton icon={Bookmark}>Saved Views</FilterButton>
            <button
              className="inline-flex h-[var(--control-height-md)] items-center gap-2 rounded-[var(--control-radius)] px-3 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]"
              onClick={clearFilters}
              type="button"
            >
              <RotateCcw className="size-[var(--icon-sm)]" />
              Clear filters
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-[var(--space-3)] md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            <span className="font-bold text-[var(--color-text)]">
              {isLoading ? "Loading" : visibleLeads.length}
            </span>{" "}
            {isLoading ? "leads..." : "leads found"}
            {!isLoading ? (
              <span className="ml-[var(--space-5)] font-bold text-[var(--color-danger)]">
                {overdueCount} overdue follow-ups
              </span>
            ) : null}
          </p>
          <div className="flex items-center gap-[var(--space-3)]">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Sort by</span>
            <FilterSelect
              label={sort === "FOLLOW_UP_DATE" ? "Follow-up date" : "Recently Added"}
              onChange={(event) => setSort(event.target.value)}
              options={[
                { label: "Follow-up date", value: "FOLLOW_UP_DATE" },
                { label: "Recently Added", value: "RECENTLY_ADDED" },
              ]}
              value={sort}
            />
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

        <LeadsTable
          isLoading={isLoading}
          leads={visibleLeads}
          onDelete={setLeadToDelete}
          onEdit={openEditDialog}
          onOpen={openLeadDetails}
        />
      </div>

      <LeadFormDialog
        batches={batches}
        form={leadForm}
        isOpen={leadDialogMode !== null}
        isSaving={isSaving}
        mode={leadDialogMode ?? "create"}
        onChange={setLeadForm}
        onClose={() => setLeadDialogMode(null)}
        onSave={saveLead}
        programs={programs}
        staff={staff}
      />

      <LeadDetailDialog
        followUpForm={followUpForm}
        followUps={followUps}
        isOpen={Boolean(detailLead)}
        isSaving={isSaving}
        lead={detailLead}
        lostRemark={lostRemark}
        onAddFollowUp={addFollowUp}
        onClose={() => setDetailLead(null)}
        onConvert={convertLead}
        onDelete={(lead) => setLeadToDelete(lead)}
        onEdit={openEditDialog}
        onFollowUpChange={setFollowUpForm}
        onLostRemarkChange={setLostRemark}
        onMarkLost={markLost}
        onReEngage={reEngage}
      />

      <ConfirmDialog
        isOpen={Boolean(leadToDelete)}
        isSaving={isSaving}
        message={`Delete ${leadToDelete?.name ?? "this lead"}? This cannot be undone.`}
        onClose={() => setLeadToDelete(null)}
        onConfirm={removeLead}
        title="Delete Lead"
      />
    </AppShell>
  );
}

function PageTop({
  onNewLead,
  onSearchChange,
  search,
}: {
  onNewLead: () => void;
  onSearchChange: (value: string) => void;
  search: string;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-4)] border-b border-[var(--color-divider)] pb-[var(--space-5)] xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-[var(--color-text)]">
          Enquiry Leads
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage enquiries, follow-ups and customer conversions.
        </p>
      </div>
      <div className="flex flex-col gap-[var(--space-3)] md:flex-row">
        <label className="relative h-[var(--control-height-lg)] min-w-[20rem]">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            className="h-full w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-11 pr-[var(--control-padding-x)] text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search leads — name, phone, email, ID"
            type="search"
            value={search}
          />
        </label>
        <Button className="gap-2" onClick={onNewLead}>
          <Plus className="size-[var(--icon-sm)]" />
          New Lead
        </Button>
      </div>
    </div>
  );
}

function LeadsTable({
  isLoading,
  leads,
  onDelete,
  onEdit,
  onOpen,
}: {
  isLoading: boolean;
  leads: Lead[];
  onDelete: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onOpen: (lead: Lead) => void;
}) {
  const groups: LeadGroup[] = ["OVERDUE", "TODAY", "UPCOMING"];

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[78rem] border-collapse text-left text-sm">
          <thead className="h-[var(--table-header-height)] bg-[var(--table-header-background)] text-xs font-bold text-[var(--color-text)]">
            <tr>
              <th className="w-12 px-[var(--table-cell-padding-x)]">
                <input aria-label="Select all leads" type="checkbox" />
              </th>
              {["Lead", "Created on", "Source", "Interest", "Batch time", "Status", "Next follow-up", "Owner", "Actions"].map((heading) => (
                <th className="px-[var(--table-cell-padding-x)]" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-divider)]">
            {isLoading ? (
              <tr>
                <td className="h-32 text-center text-[var(--color-text-muted)]" colSpan={10}>
                  Loading leads...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td className="h-32 text-center text-[var(--color-text-muted)]" colSpan={10}>
                  No leads match the current filters.
                </td>
              </tr>
            ) : (
              groups.map((group) => {
                const groupLeads = leads.filter((lead) => groupLead(lead) === group);
                if (groupLeads.length === 0) return null;
                return (
                  <LeadGroupRows
                    group={group}
                    key={group}
                    leads={groupLeads}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onOpen={onOpen}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function LeadGroupRows({
  group,
  leads,
  onDelete,
  onEdit,
  onOpen,
}: {
  group: LeadGroup;
  leads: Lead[];
  onDelete: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onOpen: (lead: Lead) => void;
}) {
  const meta = groupMeta[group];

  return (
    <>
      <tr className={cn("h-10 text-xs font-bold uppercase", meta.tone)}>
        <td colSpan={10} className="px-[var(--table-cell-padding-x)]">
          <div className="flex items-center gap-2">
            <ChevronDown className="size-4" />
            {meta.label}
            <span className="rounded-[var(--radius-full)] bg-white/70 px-2 py-0.5 text-xs">
              {leads.length}
            </span>
          </div>
        </td>
      </tr>
      {leads.map((lead) => (
        <tr className="h-[var(--table-row-height)] hover:bg-[var(--table-row-hover)]" key={lead.id}>
          <td className="px-[var(--table-cell-padding-x)]">
            <input aria-label={`Select ${lead.name}`} type="checkbox" />
          </td>
          <td className="px-[var(--table-cell-padding-x)]">
            <button
              className="flex items-center gap-[var(--space-3)] text-left"
              onClick={() => onOpen(lead)}
              type="button"
            >
              <InitialAvatar name={lead.name} tone={avatarTone(lead.name)} />
              <div>
                <p className="font-semibold text-[var(--color-text)]">{lead.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{lead.phone}</p>
              </div>
            </button>
          </td>
          <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text)]">{formatDate(lead.createdAt)}</td>
          <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text)]">{formatEnum(lead.source)}</td>
          <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text)]">{formatInterest(lead)}</td>
          <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text-secondary)]">{lead.preferredBatch?.name ?? "—"}</td>
          <td className="px-[var(--table-cell-padding-x)]">
            <StatusBadge status={leadStatusTone(lead)}>
              {lead.stage === "TRIAL_SCHEDULED" ? "Trial Scheduled" : formatLeadStatus(lead.status)}
            </StatusBadge>
          </td>
          <td className={cn(
            "px-[var(--table-cell-padding-x)]",
            group === "OVERDUE" ? "font-semibold text-[var(--color-danger)]" : "text-[var(--color-text)]",
          )}>
            {formatDate(lead.nextFollowUpAt)}
          </td>
          <td className="px-[var(--table-cell-padding-x)]">
            <InitialAvatar className="size-8" name={lead.assignedStaff?.fullName ?? "AV"} tone={avatarTone(lead.assignedStaff?.fullName ?? "AV")} />
          </td>
          <td className="px-[var(--table-cell-padding-x)]">
            <div className="flex items-center gap-2">
              <ActionButton label={`Call ${lead.name}`} icon={Phone} />
              <ActionButton label={`WhatsApp ${lead.name}`} icon={MessageCircle} tone="success" />
              <button
                aria-label={`Edit ${lead.name}`}
                className="grid size-8 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
                onClick={() => onEdit(lead)}
                type="button"
              >
                <MoreVertical className="size-[var(--icon-sm)]" />
              </button>
              <button
                className="rounded-[var(--radius-md)] px-2 py-1 text-xs font-bold text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)]"
                onClick={() => onDelete(lead)}
                type="button"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function LeadFormDialog({
  batches,
  form,
  isOpen,
  isSaving,
  mode,
  onChange,
  onClose,
  onSave,
  programs,
  staff,
}: {
  batches: Batch[];
  form: LeadFormState;
  isOpen: boolean;
  isSaving: boolean;
  mode: "create" | "edit";
  onChange: (form: LeadFormState) => void;
  onClose: () => void;
  onSave: () => void;
  programs: Program[];
  staff: Staff[];
}) {
  return (
    <Dialog className="max-w-3xl" isOpen={isOpen} onClose={onClose} title={mode === "create" ? "New Lead" : "Edit Lead"}>
      <div className="grid gap-[var(--space-4)] md:grid-cols-2">
        <Field label="Name">
          <Input onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="Kavya Pillai" value={form.name} />
        </Field>
        <Field label="Phone">
          <Input onChange={(event) => onChange({ ...form, phone: event.target.value })} placeholder="+919955676789" value={form.phone} />
        </Field>
        <Field label="DOB">
          <Input onChange={(event) => onChange({ ...form, dob: event.target.value })} type="date" value={form.dob} />
        </Field>
        <Field label="Source">
          <Select value={form.source} onChange={(value) => onChange({ ...form, source: value as LeadSource })} options={sourceOptions.filter((option) => option.value)} />
        </Field>
        <Field label="Interest">
          <select
            className="h-[var(--control-height-md)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
            onChange={(event) => {
              const next = new Set(form.programIds ?? []);
              if (event.target.value) next.add(event.target.value);
              onChange({ ...form, programIds: Array.from(next) });
            }}
            value=""
          >
            <option value="">Add interest</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>{program.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Preferred batch">
          <Select
            onChange={(value) => onChange({ ...form, preferredBatchId: value })}
            options={[{ label: "No batch", value: "" }, ...batches.map((batch) => ({ label: batch.name, value: batch.id }))]}
            value={form.preferredBatchId ?? ""}
          />
        </Field>
        <Field label="Batch type">
          <Select
            onChange={(value) => onChange({ ...form, batchTypePref: value as BatchTypePref })}
            options={[
              { label: "Group Batch", value: "GROUP_BATCH" },
              { label: "Group PT", value: "GROUP_PT" },
              { label: "Personal Training", value: "PERSONAL_TRAINING" },
            ]}
            value={form.batchTypePref ?? "GROUP_BATCH"}
          />
        </Field>
        <Field label="Owner">
          <Select
            onChange={(value) => onChange({ ...form, assignedStaffId: value })}
            options={[{ label: "Unassigned", value: "" }, ...staff.map((person) => ({ label: person.fullName, value: person.id }))]}
            value={form.assignedStaffId ?? ""}
          />
        </Field>
        {mode === "edit" ? (
          <>
            <Field label="Stage">
              <Select
                onChange={(value) => onChange({ ...form, stage: value as LeadStage })}
                options={[
                  { label: "Enquiry", value: "ENQUIRY" },
                  { label: "Trial Scheduled", value: "TRIAL_SCHEDULED" },
                  { label: "Trial Completed", value: "TRIAL_COMPLETED" },
                  { label: "Converted", value: "CONVERTED" },
                  { label: "Lost/Declined", value: "LOST_DECLINE" },
                ]}
                value={form.stage ?? "ENQUIRY"}
              />
            </Field>
            <Field label="Status">
              <Select
                onChange={(value) => onChange({ ...form, status: value as LeadStatus })}
                options={statusOptions.filter((option) => option.value)}
                value={form.status ?? "NEW"}
              />
            </Field>
          </>
        ) : null}
        <Field label="Next follow-up">
          <Input
            onChange={(event) => onChange({ ...form, nextFollowUpAt: event.target.value })}
            type="datetime-local"
            value={form.nextFollowUpAt}
          />
        </Field>
        <Field label="Remark">
          <textarea
            className="min-h-24 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)] md:col-span-2"
            onChange={(event) => onChange({ ...form, remark: event.target.value })}
            placeholder="Interested in evening batch"
            value={form.remark}
          />
        </Field>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          {(form.programIds ?? []).map((programId) => {
            const program = programs.find((item) => item.id === programId);
            return (
              <button
                className="rounded-[var(--radius-full)] bg-[var(--color-info-surface)] px-3 py-1 text-xs font-bold text-[var(--color-info)]"
                key={programId}
                onClick={() => onChange({ ...form, programIds: form.programIds?.filter((id) => id !== programId) })}
                type="button"
              >
                {program?.name ?? programId} ×
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-[var(--space-3)] md:col-span-2">
          <Button onClick={onClose} type="button" variant="secondary">Cancel</Button>
          <Button disabled={isSaving || !form.name || !form.phone} onClick={onSave} type="button">
            {isSaving ? "Saving..." : "Save Lead"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function LeadDetailDialog({
  followUpForm,
  followUps,
  isOpen,
  isSaving,
  lead,
  lostRemark,
  onAddFollowUp,
  onClose,
  onConvert,
  onDelete,
  onEdit,
  onFollowUpChange,
  onLostRemarkChange,
  onMarkLost,
  onReEngage,
}: {
  followUpForm: { note: string; outcome: FollowUpOutcome; scheduledAt: string };
  followUps: LeadFollowUp[];
  isOpen: boolean;
  isSaving: boolean;
  lead: Lead | null;
  lostRemark: string;
  onAddFollowUp: () => void;
  onClose: () => void;
  onConvert: () => void;
  onDelete: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onFollowUpChange: (form: { note: string; outcome: FollowUpOutcome; scheduledAt: string }) => void;
  onLostRemarkChange: (remark: string) => void;
  onMarkLost: () => void;
  onReEngage: () => void;
}) {
  if (!lead) return null;

  return (
    <Dialog className="max-w-4xl" isOpen={isOpen} onClose={onClose} title={lead.name}>
      <div className="grid gap-[var(--space-5)] lg:grid-cols-[1fr_1.1fr]">
        <Card className="p-[var(--space-4)]">
          <div className="flex items-start justify-between gap-[var(--space-4)]">
            <div className="flex items-center gap-[var(--space-3)]">
              <InitialAvatar name={lead.name} tone={avatarTone(lead.name)} />
              <div>
                <p className="font-bold text-[var(--color-text)]">{lead.name}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{lead.phone}</p>
              </div>
            </div>
            <StatusBadge status={leadStatusTone(lead)}>
              {lead.stage === "TRIAL_SCHEDULED" ? "Trial Scheduled" : formatLeadStatus(lead.status)}
            </StatusBadge>
          </div>
          <div className="mt-[var(--space-5)] grid gap-3 text-sm">
            <DetailRow label="Created" value={formatDate(lead.createdAt)} />
            <DetailRow label="Source" value={formatEnum(lead.source)} />
            <DetailRow label="Interest" value={formatInterest(lead)} />
            <DetailRow label="Batch" value={lead.preferredBatch?.name ?? "—"} />
            <DetailRow label="Owner" value={lead.assignedStaff?.fullName ?? "—"} />
            <DetailRow label="Next follow-up" value={formatDateTime(lead.nextFollowUpAt)} />
            <DetailRow label="Remark" value={lead.remark ?? "—"} />
          </div>
          <div className="mt-[var(--space-5)] flex flex-wrap gap-[var(--space-3)]">
            <Button onClick={() => onEdit(lead)} type="button">Edit</Button>
            <Button onClick={onConvert} type="button" variant="secondary">Convert</Button>
            {lead.stage === "LOST_DECLINE" ? (
              <Button onClick={onReEngage} type="button" variant="secondary">Re-engage</Button>
            ) : null}
            <Button onClick={() => onDelete(lead)} type="button" variant="secondary">Delete</Button>
          </div>
          <div className="mt-[var(--space-4)] grid gap-2">
            <Input
              onChange={(event) => onLostRemarkChange(event.target.value)}
              placeholder="Lost reason"
              value={lostRemark}
            />
            <Button disabled={isSaving} onClick={onMarkLost} type="button" variant="secondary">
              Mark Lost
            </Button>
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
            <Select
              onChange={(value) => onFollowUpChange({ ...followUpForm, outcome: value as FollowUpOutcome })}
              options={[
                { label: "Pending", value: "PENDING" },
                { label: "Done", value: "DONE" },
                { label: "Unreachable", value: "UNREACHABLE" },
                { label: "Rescheduled", value: "RESCHEDULED" },
              ]}
              value={followUpForm.outcome}
            />
            <textarea
              className="min-h-20 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] py-3 text-sm outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)] md:col-span-2"
              onChange={(event) => onFollowUpChange({ ...followUpForm, note: event.target.value })}
              placeholder="Follow-up note"
              value={followUpForm.note}
            />
            <Button className="md:col-span-2" disabled={isSaving || !followUpForm.scheduledAt} onClick={onAddFollowUp} type="button">
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
                      {formatEnum(followUp.outcome)}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">{followUp.note || "No note"}</p>
                </div>
              ))
            )}
          </div>
        </Card>
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

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
      {label}
      {children}
    </label>
  );
}

function Select({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value?: string;
}) {
  return (
    <select
      className="h-[var(--control-height-md)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
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

function ActionButton({
  icon: Icon,
  label,
  tone = "default",
}: {
  icon: typeof Phone;
  label: string;
  tone?: "default" | "success";
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid size-8 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-surface-hover)]",
        tone === "success" ? "text-[var(--color-success)]" : "text-[var(--color-text-secondary)]",
      )}
      type="button"
    >
      <Icon className="size-[var(--icon-sm)]" />
    </button>
  );
}

function cleanLeadPayload(form: LeadFormState): UpdateLeadPayload {
  const nextFollowUpAt = form.nextFollowUpAt
    ? new Date(form.nextFollowUpAt).toISOString()
    : undefined;
  return Object.fromEntries(
    Object.entries({ ...form, nextFollowUpAt }).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== "" && value !== undefined;
    }),
  ) as UpdateLeadPayload;
}

function sortLeads(data: Lead[], sort: string) {
  return [...data].sort((a, b) => {
    if (sort === "FOLLOW_UP_DATE") {
      return new Date(a.nextFollowUpAt ?? 0).getTime() - new Date(b.nextFollowUpAt ?? 0).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function groupLead(lead: Lead): LeadGroup {
  if (!lead.nextFollowUpAt) return "UPCOMING";
  const followUp = new Date(lead.nextFollowUpAt);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(start.getTime() + 86400000);
  if (followUp < start) return "OVERDUE";
  if (followUp < tomorrow) return "TODAY";
  return "UPCOMING";
}

function isInCreatedRange(value: string, range: CreatedRange) {
  if (range === "ALL") return true;
  const date = new Date(value);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "TODAY") return date >= start;
  if (range === "LAST_7") return date >= new Date(start.getTime() - 7 * 86400000);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function leadStatusTone(lead: Lead) {
  if (lead.stage === "TRIAL_SCHEDULED") return "trial";
  if (lead.status === "LEAD_FOLLOW_UP") return "pending";
  if (lead.status === "LEAD_UNREACHABLE") return "lost";
  return "active";
}

function formatInterest(lead: Lead) {
  const names = lead.interests?.map((interest) => interest.program?.name).filter(Boolean);
  return names?.length ? names.join(", ") : "—";
}

function avatarTone(name: string): AvatarTone {
  const tones: AvatarTone[] = ["orange", "green", "purple", "blue", "teal", "red"];
  return tones[name.length % tones.length];
}

function formatLeadStatus(status: string) {
  if (status === "NEW") return "New";
  return formatEnum(status);
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
}

function dateOnly(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
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

function formatDateTime(value?: string | null) {
  if (!value) return "—";
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
