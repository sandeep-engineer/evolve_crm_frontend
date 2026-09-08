"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ChevronLeft, ChevronRight, Eye, MapPin, Pencil, Plus, RefreshCw, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { AuthApiError, getCurrentUser, type AuthUser } from "@/lib/api/auth";
import {
  BranchApiError,
  createBranch,
  deactivateBranch,
  getBranch,
  listBranches,
  reactivateBranch,
  type Branch,
  type BranchStatus,
  updateBranch,
} from "@/lib/api/branches";
import { getOrganizations, type Organization } from "@/lib/api/organizations";
import { clearSession, getAccessToken, saveSession } from "@/lib/session";

const PAGE_SIZE = 10;

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function actorSummary(userId: string | null) {
  return userId ? `User #${userId}` : "Not available";
}

function canManageBranches(user: AuthUser | null) {
  return user?.role === "CRM_OWNER" || user?.role === "ORGANIZATION_OWNER";
}

function canEditBranch(user: AuthUser | null, branch: Branch) {
  if (branch.status !== "ACTIVE") return false;
  return canManageBranches(user) || user?.role === "BRANCH_ADMIN";
}

export function BranchManagement() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<BranchStatus | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<Branch | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [branchToChange, setBranchToChange] = useState<Branch | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId],
  );
  const hasOrganizationScope = Boolean(
    user && (user.role !== "CRM_OWNER" || selectedOrganizationId),
  );
  const scopeOrganizationId = user?.role === "CRM_OWNER"
    ? selectedOrganizationId
    : user?.organizationId ?? "";

  const handleApiError = useCallback(
    (apiError: unknown, fallback: string) => {
      if (
        (apiError instanceof BranchApiError && apiError.status === 401) ||
        (apiError instanceof AuthApiError && apiError.status === 401)
      ) {
        clearSession();
        router.replace("/");
        return "";
      }
      return apiError instanceof Error ? apiError.message : fallback;
    },
    [router],
  );

  const loadBranches = useCallback(async () => {
    if (!token || !user || !hasOrganizationScope) return;
    setIsLoading(true);
    try {
      const response = await listBranches(token, {
        ...(user.role === "CRM_OWNER" ? { organizationId: selectedOrganizationId } : {}),
        page,
        limit: PAGE_SIZE,
        search,
        status,
      });
      setBranches(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
      setError("");
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to load Branches.");
      if (message) setError(message);
      setBranches([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, hasOrganizationScope, page, search, selectedOrganizationId, status, token, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const accessToken = getAccessToken();
      if (!accessToken) {
        router.replace("/");
        return;
      }

      try {
        const currentUser = await getCurrentUser(accessToken);
        if (!active) return;
        saveSession(accessToken, currentUser);
        setUser(currentUser);
        setToken(accessToken);
      } catch (apiError) {
        const message = handleApiError(apiError, "Unable to verify your session.");
        if (message && active) setError(message);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [handleApiError, router]);

  useEffect(() => {
    if (!token || user?.role !== "CRM_OWNER") return;
    let active = true;

    async function loadOrganizations() {
      try {
        const response = await getOrganizations(token, { page: 1, limit: 100 });
        if (active) setOrganizations(response.data);
      } catch (apiError) {
        const message = handleApiError(apiError, "Unable to load Organizations.");
        if (message && active) setError(message);
      }
    }

    void loadOrganizations();
    return () => {
      active = false;
    };
  }, [handleApiError, token, user?.role]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBranches();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBranches]);

  function selectOrganization(organizationId: string) {
    setSelectedOrganizationId(organizationId);
    setBranches([]);
    setDetail(null);
    setPage(1);
    setTotal(0);
    setTotalPages(0);
    setError("");
  }

  function startCreate() {
    if (!scopeOrganizationId) return;
    setFormMode("create");
    setEditing(null);
    setBranchName("");
    setAddress("");
    setPhone("");
    setFormError("");
  }

  function startEdit(branch: Branch) {
    setDetail(null);
    setFormMode("edit");
    setEditing(branch);
    setBranchName(branch.name);
    setAddress(branch.address);
    setPhone(branch.phone ?? "");
    setFormError("");
  }

  function resetForm() {
    setFormMode(null);
    setEditing(null);
    setFormError("");
  }

  function closeForm() {
    if (isSaving) return;
    resetForm();
  }

  async function openDetails(branch: Branch) {
    setDetail(branch);
    setIsDetailLoading(true);
    try {
      const latest = await getBranch(token, branch.id);
      setDetail(latest);
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to load Branch details.");
      if (message) setError(message);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedAddress = address.trim();
    const trimmedName = branchName.trim();
    if (!trimmedAddress) {
      setFormError("Branch address is required.");
      return;
    }
    if (formMode === "create" && !trimmedName) {
      setFormError("Branch name is required.");
      return;
    }
    if (trimmedName.length > 100 || phone.trim().length > 15) {
      setFormError("Check the Branch name and phone number length.");
      return;
    }
    if (!formMode || !token) return;

    setIsSaving(true);
    setFormError("");
    try {
      if (formMode === "create") {
        await createBranch(token, scopeOrganizationId, {
          name: trimmedName,
          address: trimmedAddress,
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        });
        setNotice("Branch created.");
      } else if (editing) {
        const updated = await updateBranch(
          token,
          editing.id,
          user?.role === "BRANCH_ADMIN"
            ? { address: trimmedAddress, phone: phone.trim() || null }
            : { name: trimmedName, address: trimmedAddress, phone: phone.trim() || null },
        );
        setDetail((current) => (current?.id === updated.id ? updated : current));
        setNotice("Branch updated.");
      }
      resetForm();
      await loadBranches();
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to save the Branch.");
      if (message) setFormError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus() {
    if (!branchToChange) return;
    setIsSaving(true);
    try {
      const updated = branchToChange.status === "ACTIVE"
        ? await deactivateBranch(token, branchToChange.id)
        : await reactivateBranch(token, branchToChange.id);
      setBranchToChange(null);
      setDetail((current) => (current?.id === updated.id ? updated : current));
      setNotice(
        updated.status === "ACTIVE"
          ? "Branch reactivated. Branch users must sign in again."
          : "Branch deactivated. Branch users have been signed out.",
      );
      await loadBranches();
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to change the Branch status.");
      if (message) setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  const isManager = canManageBranches(user);
  const isCrmOwner = user?.role === "CRM_OWNER";
  const isBranchLevel = user?.role === "BRANCH_ADMIN" || user?.role === "RECEPTIONIST" || user?.role === "LEAD_CALLER";

  return (
    <div className="grid gap-[var(--section-gap)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Branches</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Manage gym locations, branch access, and availability.</p>
        </div>
        {isManager ? (
          <Button className="gap-2" disabled={!scopeOrganizationId} onClick={startCreate} title={!scopeOrganizationId ? "Select an Organization before creating a Branch" : undefined}>
            <Plus className="size-[var(--icon-sm)]" />
            Add Branch
          </Button>
        ) : null}
      </div>

      {isCrmOwner ? (
        <Card className="p-[var(--space-4)]">
          <label className="grid max-w-md gap-2 text-sm font-medium text-[var(--color-text)]">
            <span>Select Organization</span>
            <FilterSelect
              className="w-full"
              label={selectedOrganization?.name || "Select an Organization"}
              onChange={(event) => selectOrganization(event.target.value)}
              options={[
                { label: "Select an Organization", value: "" },
                ...organizations.map((organization) => ({ label: organization.name, value: organization.id })),
              ]}
              value={selectedOrganizationId}
            />
          </label>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Choose an Organization to view and manage its Branches.</p>
        </Card>
      ) : null}

      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--green-200)] bg-[var(--green-100)] px-4 py-3 text-sm font-medium text-[var(--green-700)]" role="status">
          <span>{notice}</span>
          <button aria-label="Dismiss Branch message" className="text-xs underline" onClick={() => setNotice("")} type="button">Dismiss</button>
        </div>
      ) : null}

      {!user ? (
        <Card className="grid min-h-64 place-items-center p-[var(--space-6)] text-sm text-[var(--color-text-secondary)]">Loading Branch access...</Card>
      ) : isCrmOwner && !selectedOrganizationId ? (
        <Card className="grid min-h-64 place-items-center p-[var(--space-6)] text-center">
          <div><MapPin className="mx-auto size-10 text-[var(--color-primary)]" /><h2 className="mt-4 text-base font-bold">Select an Organization</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Branches are always managed within an Organization.</p></div>
        </Card>
      ) : !hasOrganizationScope ? (
        <Card className="grid min-h-64 place-items-center p-[var(--space-6)] text-center"><div><h2 className="text-base font-bold">Organization scope unavailable</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Your Branch access is not configured. Contact a CRM Owner.</p></div></Card>
      ) : (
        <>
          <Card className="p-[var(--space-4)]">
            <div className="flex flex-col gap-[var(--space-3)] lg:flex-row lg:items-center">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
                <Input aria-label="Search Branches by name" className="w-full pl-10" onChange={(event) => setSearchInput(event.target.value)} placeholder="Search Branches by name" type="search" value={searchInput} />
              </label>
              <FilterSelect label="Branch status" onChange={(event) => { setStatus((event.target.value || undefined) as BranchStatus | undefined); setPage(1); }} options={statusOptions} value={status || ""} />
              <Button className="gap-2" disabled={isLoading} onClick={() => void loadBranches()} variant="secondary"><RefreshCw className="size-[var(--icon-sm)]" />Refresh</Button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-[var(--color-divider)] px-[var(--space-5)] py-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-base font-bold text-[var(--color-text)]">Branch directory</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{isLoading ? "Loading Branches..." : `${total} Branch${total === 1 ? "" : "es"} found`}</p></div>
              {isBranchLevel ? <p className="text-sm text-[var(--color-text-secondary)]">Your assigned Branch only</p> : null}
            </div>

            {error ? <ErrorState error={error} onRetry={() => void loadBranches()} /> : isLoading ? <div className="grid min-h-64 place-items-center text-sm text-[var(--color-text-secondary)]">Loading Branches...</div> : branches.length === 0 ? <EmptyState canCreate={isManager} onCreate={startCreate} /> : (
              <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-semibold uppercase text-[var(--color-text-muted)]"><tr><th className="px-5 py-3">Branch</th><th className="px-5 py-3">Address</th><th className="px-5 py-3">Phone</th>{isCrmOwner ? <th className="px-5 py-3">Organization</th> : null}<th className="px-5 py-3">Status</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[var(--color-divider)]">{branches.map((branch) => <BranchRow branch={branch} canEdit={canEditBranch(user, branch)} canManage={isManager} organizationName={isCrmOwner ? selectedOrganization?.name || "Not available" : undefined} onChangeStatus={setBranchToChange} onEdit={startEdit} onView={openDetails} key={branch.id} />)}</tbody></table></div>
            )}

            {!error && !isLoading && totalPages > 1 ? <div className="flex items-center justify-between gap-3 border-t border-[var(--color-divider)] px-[var(--space-5)] py-[var(--space-4)]"><p className="text-sm text-[var(--color-text-secondary)]">Page {page} of {totalPages}</p><div className="flex gap-2"><Button aria-label="Previous Branch page" disabled={page === 1} onClick={() => setPage((current) => current - 1)} variant="secondary"><ChevronLeft className="size-[var(--icon-sm)]" /></Button><Button aria-label="Next Branch page" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} variant="secondary"><ChevronRight className="size-[var(--icon-sm)]" /></Button></div></div> : null}
          </Card>
        </>
      )}

      <Dialog className="max-w-md" description="Use this form to create or edit a Branch." isOpen={formMode !== null} onClose={closeForm} title={formMode === "create" ? "Create Branch" : "Edit Branch"}>
        <form className="grid gap-5" onSubmit={submitForm}>
          {formMode === "edit" && user?.role === "BRANCH_ADMIN" ? <p className="rounded-[var(--radius-md)] bg-[var(--blue-100)] px-3 py-2 text-sm text-[var(--color-primary)]">Branch Admins can update only the address and phone number.</p> : null}
          {formMode !== "edit" || user?.role !== "BRANCH_ADMIN" ? <Input autoFocus label="Branch name" maxLength={100} onChange={(event) => setBranchName(event.target.value)} required value={branchName} /> : null}
          <Input label="Branch address" onChange={(event) => setAddress(event.target.value)} required value={address} />
          <Input hint="Optional" label="Phone number" maxLength={15} onChange={(event) => setPhone(event.target.value)} value={phone} />
          {formError ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{formError}</p> : null}
          <div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={closeForm} variant="secondary">Cancel</Button><Button disabled={isSaving} type="submit">{isSaving ? "Saving..." : formMode === "create" ? "Create Branch" : "Save changes"}</Button></div>
        </form>
      </Dialog>

      <Dialog className="max-w-lg" description="Sanitized Branch information and audit details." isOpen={Boolean(detail)} onClose={() => setDetail(null)} title="Branch details">
        {detail ? <BranchDetails branch={detail} canEdit={canEditBranch(user, detail)} canManage={isManager} isLoading={isDetailLoading} organizationName={isCrmOwner ? selectedOrganization?.name || "Not available" : undefined} onChangeStatus={setBranchToChange} onEdit={startEdit} /> : null}
      </Dialog>

      <Dialog className="max-w-md" description="Confirm the Branch availability change." isOpen={Boolean(branchToChange)} onClose={() => { if (!isSaving) setBranchToChange(null); }} title={branchToChange?.status === "ACTIVE" ? "Deactivate Branch" : "Reactivate Branch"}>
        {branchToChange ? <div className="grid gap-5"><p className="text-sm leading-6 text-[var(--color-text-secondary)]">{branchToChange.status === "ACTIVE" ? <>Deactivate <strong className="text-[var(--color-text)]">{branchToChange.name}</strong>? It will remain in history. Branch users will lose access and their existing sessions will be invalidated.</> : <>Reactivate <strong className="text-[var(--color-text)]">{branchToChange.name}</strong>? Users must sign in again; old sessions will not be restored.</>}</p><div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={() => setBranchToChange(null)} variant="secondary">Cancel</Button><Button disabled={isSaving} onClick={() => void changeStatus()}>{isSaving ? "Saving..." : branchToChange.status === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button></div></div> : null}
      </Dialog>
    </div>
  );
}

function BranchRow({ branch, canEdit, canManage, organizationName, onChangeStatus, onEdit, onView }: { branch: Branch; canEdit: boolean; canManage: boolean; organizationName?: string; onChangeStatus: (branch: Branch) => void; onEdit: (branch: Branch) => void; onView: (branch: Branch) => void }) {
  return <tr className="hover:bg-[var(--color-surface-hover)]"><td className="px-5 py-4"><button className="flex items-center gap-3 text-left" onClick={() => void onView(branch)} type="button"><span className="grid size-9 place-items-center rounded-full bg-[var(--blue-100)] text-[var(--color-primary)]"><MapPin className="size-[var(--icon-sm)]" /></span><span className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]">{branch.name}</span></button></td><td className="px-5 py-4 text-[var(--color-text-secondary)]">{branch.address}</td><td className="px-5 py-4 text-[var(--color-text-secondary)]">{branch.phone || "Not provided"}</td>{organizationName ? <td className="px-5 py-4 text-[var(--color-text-secondary)]">{organizationName}</td> : null}<td className="px-5 py-4"><BranchStatusPill status={branch.status} /></td><td className="px-5 py-4 text-[var(--color-text-secondary)]">{formatDate(branch.updatedAt)}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Button aria-label={`View ${branch.name}`} onClick={() => void onView(branch)} variant="ghost"><Eye className="size-[var(--icon-sm)]" /></Button>{canEdit ? <Button aria-label={`Edit ${branch.name}`} className="gap-1" onClick={() => onEdit(branch)} variant="secondary"><Pencil className="size-3.5" />Edit</Button> : null}{canManage ? <Button aria-label={`${branch.status === "ACTIVE" ? "Deactivate" : "Reactivate"} ${branch.name}`} className="gap-1" onClick={() => onChangeStatus(branch)} variant="secondary">{branch.status === "ACTIVE" ? <ToggleLeft className="size-3.5" /> : <ToggleRight className="size-3.5" />}{branch.status === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button> : null}</div></td></tr>;
}

function BranchDetails({ branch, canEdit, canManage, isLoading, organizationName, onChangeStatus, onEdit }: { branch: Branch; canEdit: boolean; canManage: boolean; isLoading: boolean; organizationName?: string; onChangeStatus: (branch: Branch) => void; onEdit: (branch: Branch) => void }) {
  return <div className="grid gap-4 text-sm"><div><p className="text-lg font-bold text-[var(--color-text)]">{branch.name}</p><div className="mt-2"><BranchStatusPill status={branch.status} /></div></div>{isLoading ? <p className="text-[var(--color-text-secondary)]">Refreshing details...</p> : null}<DetailRow label="Address" value={branch.address} /><DetailRow label="Phone" value={branch.phone || "Not provided"} />{organizationName ? <DetailRow label="Organization" value={organizationName} /> : null}<DetailRow label="Created by" value={actorSummary(branch.createdByUserId)} /><DetailRow label="Created" value={formatDate(branch.createdAt)} /><DetailRow label="Last updated" value={formatDate(branch.updatedAt)} />{branch.deactivatedAt ? <><DetailRow label="Deactivated by" value={actorSummary(branch.deactivatedByUserId)} /><DetailRow label="Deactivated" value={formatDate(branch.deactivatedAt)} /></> : null}<div className="mt-2 flex flex-wrap justify-end gap-3">{canEdit ? <Button onClick={() => onEdit(branch)} variant="secondary">Edit</Button> : null}{canManage ? <Button onClick={() => onChangeStatus(branch)} variant="secondary">{branch.status === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button> : null}</div></div>;
}

function EmptyState({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return <div className="grid min-h-64 place-items-center p-[var(--space-6)] text-center"><div><MapPin className="mx-auto size-10 text-[var(--color-primary)]" /><h2 className="mt-4 text-base font-bold">No Branches have been created</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{canCreate ? "Create your first Branch to begin managing this location." : "No Branch is currently assigned to your account."}</p>{canCreate ? <Button className="mt-4 gap-2" onClick={onCreate}><Plus className="size-[var(--icon-sm)]" />Create Branch</Button> : null}</div></div>;
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return <div className="grid min-h-64 place-items-center p-[var(--space-6)] text-center"><div><p className="font-semibold text-[var(--color-danger)]" role="alert">{error}</p><Button className="mt-4 gap-2" onClick={onRetry} variant="secondary"><RefreshCw className="size-[var(--icon-sm)]" />Retry</Button></div></div>;
}

function BranchStatusPill({ status }: { status: BranchStatus }) {
  const active = status === "ACTIVE";
  return <span className={active ? "inline-flex rounded-full bg-[var(--green-100)] px-2.5 py-1 text-xs font-semibold text-[var(--green-700)]" : "inline-flex rounded-full bg-[var(--gray-100)] px-2.5 py-1 text-xs font-semibold text-[var(--gray-700)]"}>{active ? "Active" : "Inactive"}</span>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-t border-[var(--color-divider)] pt-3"><span className="text-[var(--color-text-secondary)]">{label}</span><span className="text-right font-medium text-[var(--color-text)]">{value}</span></div>;
}
