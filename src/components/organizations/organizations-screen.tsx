"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { OrganizationOwnersDialog } from "@/components/organizations/organization-owners-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { AuthApiError, getCurrentUser, type AuthUser } from "@/lib/api/auth";
import {
  createOrganization,
  deactivateOrganization,
  getOrganization,
  getOrganizations,
  OrganizationApiError,
  reactivateOrganization,
  type Organization,
  type OrganizationStatus,
  updateOrganization,
} from "@/lib/api/organizations";
import { clearSession, getAccessToken, getStoredUser, saveSession } from "@/lib/session";

const PAGE_SIZE = 20;

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
      }).format(date);
}

function creatorSummary(organization: Organization) {
  return organization.createdByUserId
    ? `User #${organization.createdByUserId}`
    : "Not available";
}

export function OrganizationsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrganizationStatus | undefined>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [detail, setDetail] = useState<Organization | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [organizationToChange, setOrganizationToChange] = useState<Organization | null>(null);
  const [organizationForOwners, setOrganizationForOwners] = useState<Organization | null>(null);

  const handleApiError = useCallback(
    (apiError: unknown, fallback: string) => {
      if (
        (apiError instanceof OrganizationApiError && apiError.status === 401) ||
        (apiError instanceof AuthApiError && apiError.status === 401)
      ) {
        clearSession();
        router.replace("/");
        return "";
      }
      if (apiError instanceof OrganizationApiError && apiError.status === 403) {
        router.replace("/dashboard");
        return "";
      }
      return apiError instanceof Error ? apiError.message : fallback;
    },
    [router],
  );

  const loadOrganizations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await getOrganizations(token, {
        page,
        limit: PAGE_SIZE,
        search,
        status,
      });
      setOrganizations(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
      setError("");
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to load organizations.");
      if (message) setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, page, search, status, token]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const accessToken = getAccessToken();
    const storedUser = getStoredUser();
    if (!accessToken) {
      router.replace("/");
      return;
    }

    if (storedUser?.role && storedUser.role !== "CRM_OWNER") {
      router.replace("/dashboard");
      return;
    }

    getCurrentUser(accessToken)
      .then((currentUser) => {
        if (currentUser.role !== "CRM_OWNER") {
          router.replace("/dashboard");
          return;
        }
        saveSession(accessToken, currentUser);
        setUser(currentUser);
        setToken(accessToken);
      })
      .catch((apiError) => {
        const message = handleApiError(apiError, "Unable to verify your session.");
        if (message) setError(message);
      });
  }, [handleApiError, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrganizations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrganizations]);

  function closeCreate() {
    if (isSaving) return;
    setIsCreateOpen(false);
    setName("");
    setFormError("");
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Organization name is required.");
      return;
    }
    if (trimmedName.length > 150) {
      setFormError("Organization name must be 150 characters or fewer.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      await createOrganization(token, { name: trimmedName });
      setIsCreateOpen(false);
      setName("");
      setNotice("Organization created.");
      await loadOrganizations();
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to create the organization.");
      if (message) setFormError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function openDetails(organization: Organization) {
    setDetail(organization);
    setIsDetailLoading(true);
    try {
      const latest = await getOrganization(token, organization.id);
      setDetail(latest);
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to load organization details.");
      if (message) setError(message);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Organization name is required.");
      return;
    }
    if (trimmedName.length > 150) {
      setFormError("Organization name must be 150 characters or fewer.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      const updated = await updateOrganization(token, editing.id, { name: trimmedName });
      setEditing(null);
      setName("");
      setNotice("Organization updated.");
      setDetail((current) => (current?.id === updated.id ? updated : current));
      await loadOrganizations();
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to update the organization.");
      if (message) setFormError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus() {
    if (!organizationToChange) return;
    setIsSaving(true);
    try {
      const updated =
        organizationToChange.status === "ACTIVE"
          ? await deactivateOrganization(token, organizationToChange.id)
          : await reactivateOrganization(token, organizationToChange.id);
      setOrganizationToChange(null);
      setDetail((current) => (current?.id === updated.id ? updated : current));
      setNotice(
        updated.status === "ACTIVE"
          ? "Organization reactivated."
          : "Organization deactivated. Historical data remains available.",
      );
      await loadOrganizations();
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to update organization status.");
      if (message) setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(organization: Organization) {
    setDetail(null);
    setEditing(organization);
    setName(organization.name);
    setFormError("");
  }

  function manageOwners(organization: Organization) {
    setDetail(null);
    setOrganizationForOwners(organization);
  }

  function handleOwnerSessionExpired() {
    clearSession();
    router.replace("/");
  }

  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="grid gap-[var(--section-gap)]">
        <PageHeader
          title="Organizations"
          description="Manage organizations across the Evolve CRM platform."
          actions={
            <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-[var(--icon-sm)]" />
              Create Organization
            </Button>
          }
        />

        {notice ? (
          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--green-200)] bg-[var(--green-100)] px-4 py-3 text-sm font-medium text-[var(--green-700)]" role="status">
            <span>{notice}</span>
            <button aria-label="Dismiss success message" className="text-xs underline" onClick={() => setNotice("")} type="button">Dismiss</button>
          </div>
        ) : null}

        <Card className="p-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-3)] lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input aria-label="Search organizations by name" className="w-full pl-10" onChange={(event) => setSearchInput(event.target.value)} placeholder="Search organizations by name" type="search" value={searchInput} />
            </label>
            <FilterSelect label="Organization status" onChange={(event) => { setStatus((event.target.value || undefined) as OrganizationStatus | undefined); setPage(1); }} options={statusOptions} value={status || ""} />
            <Button className="gap-2" disabled={isLoading} onClick={() => void loadOrganizations()} variant="secondary">
              <RefreshCw className="size-[var(--icon-sm)]" />
              Refresh
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-[var(--color-divider)] px-[var(--space-5)] py-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">Organization directory</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{isLoading ? "Loading organizations..." : `${total} organization${total === 1 ? "" : "s"} found`}</p>
            </div>
          </div>

          {error ? (
            <div className="grid min-h-64 place-items-center p-[var(--space-6)] text-center">
              <div>
                <p className="font-semibold text-[var(--color-danger)]" role="alert">{error}</p>
                <Button className="mt-4 gap-2" onClick={() => void loadOrganizations()} variant="secondary"><RefreshCw className="size-[var(--icon-sm)]" />Retry</Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="grid min-h-64 place-items-center text-sm text-[var(--color-text-secondary)]">Loading organizations...</div>
          ) : organizations.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-[var(--space-6)] text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-[var(--radius-full)] bg-[var(--blue-100)] text-[var(--color-primary)]"><Building2 className="size-[var(--icon-md)]" /></span>
                <h2 className="mt-4 text-base font-bold">No organizations found</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Try another search or create the first organization.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                  <tr><th className="px-5 py-3">Organization</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created by</th><th className="px-5 py-3">Created</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-divider)]">
                  {organizations.map((organization) => (
                    <tr className="hover:bg-[var(--color-surface-hover)]" key={organization.id}>
                      <td className="px-5 py-4"><button className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] hover:underline" onClick={() => void openDetails(organization)} type="button">{organization.name}</button></td>
                      <td className="px-5 py-4"><StatusPill status={organization.status} /></td>
                      <td className="px-5 py-4 text-[var(--color-text-secondary)]">{creatorSummary(organization)}</td>
                      <td className="px-5 py-4 text-[var(--color-text-secondary)]">{formatDate(organization.createdAt)}</td>
                      <td className="px-5 py-4 text-[var(--color-text-secondary)]">{formatDate(organization.updatedAt)}</td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-2"><Button aria-label={`View ${organization.name}`} onClick={() => void openDetails(organization)} variant="ghost">View</Button><Button aria-label={`Manage Organization Owners for ${organization.name}`} onClick={() => manageOwners(organization)} variant="secondary">Owners</Button><Button aria-label={`Edit ${organization.name}`} className="gap-1" onClick={() => startEdit(organization)} variant="secondary"><Pencil className="size-3.5" />Edit</Button><Button aria-label={`${organization.status === "ACTIVE" ? "Deactivate" : "Reactivate"} ${organization.name}`} className="gap-1" onClick={() => setOrganizationToChange(organization)} variant="secondary">{organization.status === "ACTIVE" ? <ToggleLeft className="size-3.5" /> : <ToggleRight className="size-3.5" />}{organization.status === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!error && !isLoading && totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-[var(--color-divider)] px-[var(--space-5)] py-[var(--space-4)]">
              <p className="text-sm text-[var(--color-text-secondary)]">Page {page} of {totalPages}</p>
              <div className="flex gap-2"><Button aria-label="Previous page" disabled={page === 1} onClick={() => setPage((current) => current - 1)} variant="secondary"><ChevronLeft className="size-[var(--icon-sm)]" /></Button><Button aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} variant="secondary"><ChevronRight className="size-[var(--icon-sm)]" /></Button></div>
            </div>
          ) : null}
        </Card>
      </div>

      <Dialog className="max-w-md" isOpen={isCreateOpen || Boolean(editing)} onClose={isCreateOpen ? closeCreate : () => { if (!isSaving) { setEditing(null); setName(""); setFormError(""); } }} title={editing ? "Edit Organization" : "Create Organization"}>
        <form className="grid gap-5" onSubmit={editing ? submitEdit : submitCreate}>
          <Input autoFocus label="Organization name" maxLength={150} onChange={(event) => setName(event.target.value)} placeholder="Evolve - MMA and Calisthenics" required value={name} />
          {formError ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{formError}</p> : null}
          <div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={isCreateOpen ? closeCreate : () => { setEditing(null); setName(""); setFormError(""); }} variant="secondary">Cancel</Button><Button disabled={isSaving} type="submit">{isSaving ? "Saving..." : editing ? "Save changes" : "Create Organization"}</Button></div>
        </form>
      </Dialog>

      <Dialog className="max-w-lg" isOpen={Boolean(detail)} onClose={() => setDetail(null)} title="Organization details">
        {detail ? <div className="grid gap-4 text-sm"><div><p className="text-lg font-bold text-[var(--color-text)]">{detail.name}</p><div className="mt-2"><StatusPill status={detail.status} /></div></div>{isDetailLoading ? <p className="text-[var(--color-text-secondary)]">Refreshing details...</p> : null}<DetailRow label="Created by" value={creatorSummary(detail)} /><DetailRow label="Created" value={formatDate(detail.createdAt)} /><DetailRow label="Last updated" value={formatDate(detail.updatedAt)} />{detail.deactivatedAt ? <><DetailRow label="Deactivated" value={formatDate(detail.deactivatedAt)} /><DetailRow label="Deactivated by" value={detail.deactivatedByUserId ? `User #${detail.deactivatedByUserId}` : "Not available"} /></> : null}<div className="mt-2 flex flex-wrap justify-end gap-3"><Button onClick={() => manageOwners(detail)} variant="secondary">Manage owners</Button><Button onClick={() => startEdit(detail)} variant="secondary">Edit</Button><Button onClick={() => { setDetail(null); setOrganizationToChange(detail); }} variant="secondary">{detail.status === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button></div></div> : null}
      </Dialog>

      <OrganizationOwnersDialog
        onClose={() => setOrganizationForOwners(null)}
        onSessionExpired={handleOwnerSessionExpired}
        organization={organizationForOwners}
        token={token}
      />

      <Dialog className="max-w-md" isOpen={Boolean(organizationToChange)} onClose={() => { if (!isSaving) setOrganizationToChange(null); }} title={organizationToChange?.status === "ACTIVE" ? "Deactivate Organization" : "Reactivate Organization"}>
        {organizationToChange ? <div className="grid gap-5"><p className="text-sm leading-6 text-[var(--color-text-secondary)]">{organizationToChange.status === "ACTIVE" ? <>Deactivate <strong className="text-[var(--color-text)]">{organizationToChange.name}</strong>? It will not be deleted and historical data will remain. Scoped Organization users will be unable to authenticate while it is inactive.</> : <>Reactivate <strong className="text-[var(--color-text)]">{organizationToChange.name}</strong>? Scoped Organization users will be able to authenticate again.</>}</p><div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={() => setOrganizationToChange(null)} variant="secondary">Cancel</Button><Button disabled={isSaving} onClick={() => void changeStatus()}>{isSaving ? "Saving..." : organizationToChange.status === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button></div></div> : null}
      </Dialog>
    </AppShell>
  );
}

function StatusPill({ status }: { status: OrganizationStatus }) {
  const active = status === "ACTIVE";
  return <span className={active ? "inline-flex rounded-full bg-[var(--green-100)] px-2.5 py-1 text-xs font-semibold text-[var(--green-700)]" : "inline-flex rounded-full bg-[var(--gray-100)] px-2.5 py-1 text-xs font-semibold text-[var(--gray-700)]"}>{active ? "Active" : "Inactive"}</span>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-t border-[var(--color-divider)] pt-3"><span className="text-[var(--color-text-secondary)]">{label}</span><span className="text-right font-medium text-[var(--color-text)]">{value}</span></div>;
}
