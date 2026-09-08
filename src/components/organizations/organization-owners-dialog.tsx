"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Copy,
  Eye,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import {
  createOrganizationOwner,
  deactivateOrganizationOwner,
  getOrganizationOwner,
  listOrganizationOwners,
  OrganizationApiError,
  reactivateOrganizationOwner,
  type CreateOrganizationOwnerPayload,
  type Organization,
  type OrganizationOwner,
  type OrganizationOwnerStatus,
  updateOrganizationOwner,
} from "@/lib/api/organizations";

const PAGE_SIZE = 10;

const ownerStatusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Pending setup", value: "PENDING_SETUP" },
];

type CredentialDisplay = {
  email: string;
  initialPassword: string;
  name: string;
  phone: string | null;
};

type OrganizationOwnersDialogProps = {
  onClose: () => void;
  onSessionExpired: () => void;
  organization: Organization | null;
  token: string;
};

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

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

function ownerStatusLabel(status: OrganizationOwnerStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => `${part[0]?.toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function validateOwnerForm(values: CreateOrganizationOwnerPayload) {
  if (!values.name.trim()) return "Name is required.";
  if (values.name.trim().length > 120) return "Name must be 120 characters or fewer.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return "Enter a valid email address.";

  const digits = values.phone.replace(/\D/g, "");
  const nationalNumber = digits.length === 10 ? digits : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : "";
  if (!/^[6-9]\d{9}$/.test(nationalNumber)) return "Enter a valid Indian mobile number.";
  return "";
}

export function OrganizationOwnersDialog(props: OrganizationOwnersDialogProps) {
  return <OrganizationOwnersDialogContent key={props.organization?.id ?? "no-organization"} {...props} />;
}

function OrganizationOwnersDialogContent({
  onClose,
  onSessionExpired,
  organization,
  token,
}: OrganizationOwnersDialogProps) {
  const organizationId = organization?.id ?? "";
  const isOpen = Boolean(organization && token);
  const [owners, setOwners] = useState<OrganizationOwner[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrganizationOwnerStatus | undefined>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formValues, setFormValues] = useState<CreateOrganizationOwnerPayload>({ name: "", email: "", phone: "" });
  const [formError, setFormError] = useState("");
  const [ownerDetail, setOwnerDetail] = useState<OrganizationOwner | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [editingOwner, setEditingOwner] = useState<OrganizationOwner | null>(null);
  const [ownerToChange, setOwnerToChange] = useState<OrganizationOwner | null>(null);
  const [credential, setCredential] = useState<CredentialDisplay | null>(null);
  const [hasCopiedCredential, setHasCopiedCredential] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [isCredentialCloseWarningOpen, setIsCredentialCloseWarningOpen] = useState(false);

  const clearCredential = useCallback(() => {
    setCredential(null);
    setHasCopiedCredential(false);
    setCopyError("");
    setIsCredentialCloseWarningOpen(false);
  }, []);

  const handleApiError = useCallback(
    (apiError: unknown, fallback: string) => {
      if (apiError instanceof OrganizationApiError && apiError.status === 401) {
        onSessionExpired();
        return "";
      }
      if (apiError instanceof OrganizationApiError && apiError.status === 403) {
        return "You do not have permission to manage Organization Owners.";
      }
      return apiError instanceof Error ? apiError.message : fallback;
    },
    [onSessionExpired],
  );

  const loadOwners = useCallback(async () => {
    if (!organizationId || !token) return;
    setIsLoading(true);
    try {
      const response = await listOrganizationOwners(token, organizationId, {
        page,
        limit: PAGE_SIZE,
        search,
        status,
      });
      setOwners(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setError("");
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to load Organization Owners.");
      if (message) setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, organizationId, page, search, status, token]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      void loadOwners();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadOwners]);

  function closeManager() {
    clearCredential();
    onClose();
  }

  function closeForm() {
    if (isSaving) return;
    setIsCreateOpen(false);
    setEditingOwner(null);
    setFormValues({ name: "", email: "", phone: "" });
    setFormError("");
  }

  async function openDetail(owner: OrganizationOwner) {
    if (!organizationId) return;
    setOwnerDetail(owner);
    setIsDetailLoading(true);
    try {
      const latest = await getOrganizationOwner(token, organizationId, owner.id);
      setOwnerDetail(latest);
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to load Organization Owner details.");
      if (message) setError(message);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function openEdit(owner: OrganizationOwner) {
    if (!organizationId) return;
    setIsDetailLoading(true);
    try {
      const latest = await getOrganizationOwner(token, organizationId, owner.id);
      setOwnerDetail(null);
      setEditingOwner(latest);
      setFormValues({ name: latest.name, email: latest.email, phone: latest.phone ?? "" });
      setFormError("");
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to load Organization Owner details.");
      if (message) setError(message);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function submitOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId) return;
    const values = {
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      phone: formValues.phone.trim(),
    };
    const validationError = validateOwnerForm(values);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      if (editingOwner) {
        const updated = await updateOrganizationOwner(token, organizationId, editingOwner.id, values);
        const latest = await getOrganizationOwner(token, organizationId, updated.id);
        setOwnerDetail(latest);
        setEditingOwner(null);
        setNotice("Organization Owner updated.");
      } else {
        const created = await createOrganizationOwner(token, organizationId, values);
        setCredential({
          name: created.user.name,
          email: created.user.email,
          phone: created.user.phone,
          initialPassword: created.initialPassword,
        });
        setHasCopiedCredential(false);
        setCopyError("");
        setNotice("Organization Owner created.");
      }
      setIsCreateOpen(false);
      setFormValues({ name: "", email: "", phone: "" });
      await loadOwners();
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to save the Organization Owner.");
      if (message) setFormError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus() {
    if (!organizationId || !ownerToChange) return;
    setIsSaving(true);
    try {
      const updated = ownerToChange.status === "ACTIVE"
        ? await deactivateOrganizationOwner(token, organizationId, ownerToChange.id)
        : await reactivateOrganizationOwner(token, organizationId, ownerToChange.id);
      setOwnerToChange(null);
      setOwnerDetail((current) => current?.id === updated.id ? updated : current);
      setNotice(updated.status === "ACTIVE" ? "Organization Owner reactivated." : "Organization Owner deactivated. Historical access remains visible.");
      await loadOwners();
    } catch (apiError) {
      const message = handleApiError(apiError, "Unable to update Organization Owner status.");
      if (message) setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function copyCredentials() {
    if (!credential) return;
    const text = `Organization Owner login\nEmail: ${credential.email}\nPhone: ${credential.phone ?? "Not available"}\nInitial password: ${credential.initialPassword}`;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setHasCopiedCredential(true);
      setCopyError("");
    } catch {
      setCopyError("Credentials could not be copied. Select and copy them manually before closing.");
    }
  }

  function requestCredentialClose() {
    if (hasCopiedCredential) {
      clearCredential();
      return;
    }
    setIsCredentialCloseWarningOpen(true);
  }

  if (!organization) return null;

  return (
    <>
      <Dialog
        className="max-w-6xl"
        description={`Manage Organization Owners for ${organization.name}.`}
        isOpen={isOpen}
        onClose={closeManager}
        title="Organization Owners"
      >
        <div className="grid gap-5">
          <div className="flex flex-col gap-3 border-b border-[var(--color-divider)] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-bold text-[var(--color-text)]">{organization.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <OrganizationStatusBadge status={organization.status} />
                <span>{total} Organization Owner{total === 1 ? "" : "s"}</span>
              </div>
            </div>
            <Button className="gap-2 self-start" disabled={organization.status !== "ACTIVE"} onClick={() => { setIsCreateOpen(true); setFormError(""); }}>
              <Plus className="size-[var(--icon-sm)]" />
              Add Organization Owner
            </Button>
          </div>

          {organization.status !== "ACTIVE" ? (
            <div className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--orange-200)] bg-[var(--orange-100)] px-4 py-3 text-sm text-[var(--orange-700)]" role="status">
              <AlertCircle className="mt-0.5 size-[var(--icon-sm)] shrink-0" />
              This Organization is inactive. Owners remain visible, but a new owner cannot be created and active owners still cannot sign in.
            </div>
          ) : null}

          {notice ? <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--green-200)] bg-[var(--green-100)] px-4 py-3 text-sm font-medium text-[var(--green-700)]" role="status"><span>{notice}</span><button className="text-xs underline" onClick={() => setNotice("")} type="button">Dismiss</button></div> : null}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input aria-label="Search Organization Owners" className="w-full lg:flex-1" onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, email, or phone" type="search" value={searchInput} />
            <FilterSelect label="Owner status" onChange={(event) => { setStatus((event.target.value || undefined) as OrganizationOwnerStatus | undefined); setPage(1); }} options={ownerStatusOptions} value={status ?? ""} />
            <Button aria-label="Refresh Organization Owners" className="gap-2" disabled={isLoading} onClick={() => void loadOwners()} variant="secondary"><RefreshCw className="size-[var(--icon-sm)]" />Refresh</Button>
          </div>

          {error ? (
            <div className="grid min-h-48 place-items-center text-center"><div><p className="font-semibold text-[var(--color-danger)]" role="alert">{error}</p><Button className="mt-4 gap-2" onClick={() => void loadOwners()} variant="secondary"><RefreshCw className="size-[var(--icon-sm)]" />Retry</Button></div></div>
          ) : isLoading ? (
            <div className="grid min-h-48 place-items-center text-sm text-[var(--color-text-secondary)]">Loading Organization Owners...</div>
          ) : owners.length === 0 ? (
            <div className="grid min-h-48 place-items-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-6 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--blue-100)] text-[var(--color-primary)]"><UsersRound className="size-[var(--icon-md)]" /></span><h3 className="mt-3 font-bold">No Organization Owners</h3><p className="mt-1 text-sm text-[var(--color-text-secondary)]">No Organization Owners have been created for this Organization.</p></div></div>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] md:block">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-semibold uppercase text-[var(--color-text-muted)]"><tr><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created by</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Password changed</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--color-divider)]">
                    {owners.map((owner) => <OwnerTableRow key={owner.id} onDeactivate={() => setOwnerToChange(owner)} onEdit={() => void openEdit(owner)} onReactivate={() => setOwnerToChange(owner)} onView={() => void openDetail(owner)} owner={owner} />)}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 md:hidden">{owners.map((owner) => <OwnerMobileCard key={owner.id} onDeactivate={() => setOwnerToChange(owner)} onEdit={() => void openEdit(owner)} onReactivate={() => setOwnerToChange(owner)} onView={() => void openDetail(owner)} owner={owner} />)}</div>
            </>
          )}

          {!error && !isLoading && totalPages > 1 ? <div className="flex items-center justify-between gap-3"><p className="text-sm text-[var(--color-text-secondary)]">Page {page} of {totalPages}</p><div className="flex gap-2"><Button disabled={page === 1} onClick={() => setPage((value) => value - 1)} variant="secondary">Previous</Button><Button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} variant="secondary">Next</Button></div></div> : null}
        </div>
      </Dialog>

      <Dialog className="max-w-md" description="Create or update an Organization Owner identity." isOpen={isCreateOpen || Boolean(editingOwner)} onClose={closeForm} title={editingOwner ? "Edit Organization Owner" : "Add Organization Owner"}>
        <form className="grid gap-5" onSubmit={submitOwner}>
          <Input autoFocus label="Name" maxLength={120} onChange={(event) => setFormValues((values) => ({ ...values, name: event.target.value }))} required value={formValues.name} />
          <Input label="Email" onChange={(event) => setFormValues((values) => ({ ...values, email: event.target.value }))} required type="email" value={formValues.email} />
          <Input hint="Indian mobile number" label="Phone" onChange={(event) => setFormValues((values) => ({ ...values, phone: event.target.value }))} required type="tel" value={formValues.phone} />
          {editingOwner ? <p className="text-sm text-[var(--color-text-secondary)]">Changing email or phone may require the owner to log in again because existing sessions are invalidated.</p> : null}
          {formError ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{formError}</p> : null}
          <div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={closeForm} variant="secondary">Cancel</Button><Button disabled={isSaving} type="submit">{isSaving ? "Saving..." : editingOwner ? "Save changes" : "Create Organization Owner"}</Button></div>
        </form>
      </Dialog>

      <Dialog className="max-w-xl" description="Sanitized Organization Owner details." isOpen={Boolean(ownerDetail) && !editingOwner} onClose={() => setOwnerDetail(null)} title="Organization Owner details">
        {ownerDetail ? <div className="grid gap-4"><div><p className="text-lg font-bold">{ownerDetail.name}</p><div className="mt-2"><OwnerStatusBadge status={ownerDetail.status} /></div></div>{isDetailLoading ? <p className="text-sm text-[var(--color-text-secondary)]">Refreshing details...</p> : null}<OwnerDetailRow label="Email" value={ownerDetail.email} /><OwnerDetailRow label="Phone" value={ownerDetail.phone ?? "Not available"} /><OwnerDetailRow label="Role" value="Organization Owner" /><OwnerDetailRow label="Organization" value={organization.name} /><OwnerDetailRow label="Created by" value={ownerDetail.createdBy ? `${ownerDetail.createdBy.name} (${ownerDetail.createdBy.email})` : "Not available"} /><OwnerDetailRow label="Created" value={formatDateTime(ownerDetail.createdAt)} /><OwnerDetailRow label="Last updated" value={formatDateTime(ownerDetail.updatedAt)} /><OwnerDetailRow label="Last login" value={formatDateTime(ownerDetail.lastLoginAt)} /><OwnerDetailRow label="Password changed" value={ownerDetail.passwordChangedAt ? formatDateTime(ownerDetail.passwordChangedAt) : "Not changed"} /><div className="flex flex-wrap justify-end gap-3"><Button onClick={() => void openEdit(ownerDetail)} variant="secondary">Edit</Button><OwnerStatusAction onDeactivate={() => setOwnerToChange(ownerDetail)} onReactivate={() => setOwnerToChange(ownerDetail)} owner={ownerDetail} /></div></div> : null}
      </Dialog>

      <Dialog className="max-w-md" description="Confirm the Organization Owner access change." isOpen={Boolean(ownerToChange)} onClose={() => { if (!isSaving) setOwnerToChange(null); }} title={ownerToChange?.status === "ACTIVE" ? "Deactivate Organization Owner" : "Reactivate Organization Owner"}>
        {ownerToChange ? <div className="grid gap-5"><p className="text-sm leading-6 text-[var(--color-text-secondary)]">{ownerToChange.status === "ACTIVE" ? <>Deactivate <strong className="text-[var(--color-text)]">{ownerToChange.name}</strong>? They will lose access, but their historical record remains.</> : <>Reactivate <strong className="text-[var(--color-text)]">{ownerToChange.name}</strong>? An inactive Organization still prevents login even when this owner is active.</>}</p><div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={() => setOwnerToChange(null)} variant="secondary">Cancel</Button><Button disabled={isSaving} onClick={() => void changeStatus()}>{isSaving ? "Saving..." : ownerToChange.status === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button></div></div> : null}
      </Dialog>

      <Dialog className="max-w-md" description="The generated initial password is available only in this dialog." isOpen={Boolean(credential)} onClose={requestCredentialClose} title="Share Organization Owner credentials">
        {credential ? <div className="grid gap-5"><div className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--orange-200)] bg-[var(--orange-100)] px-4 py-3 text-sm text-[var(--orange-700)]"><KeyRound className="mt-0.5 size-[var(--icon-sm)] shrink-0" /><p>This initial password is shown only once. Share it privately. The Organization Owner can change it after login.</p></div><CredentialRow label="Organization Owner" value={credential.name} /><CredentialRow label="Login email" value={credential.email} /><CredentialRow label="Login phone" value={credential.phone ?? "Not available"} /><CredentialRow label="Initial password" value={credential.initialPassword} /><Button className="gap-2" onClick={() => void copyCredentials()} variant="secondary"><Copy className="size-[var(--icon-sm)]" />Copy credentials</Button>{hasCopiedCredential ? <p className="text-sm font-medium text-[var(--green-700)]" role="status">Credentials copied.</p> : null}{copyError ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{copyError}</p> : null}<Button onClick={requestCredentialClose}>Close</Button></div> : null}
      </Dialog>

      <Dialog className="max-w-md" description="Confirm whether you want to discard the initial password without copying it." isOpen={isCredentialCloseWarningOpen} onClose={() => setIsCredentialCloseWarningOpen(false)} title="Initial password not copied">
        <div className="grid gap-5"><p className="text-sm leading-6 text-[var(--color-text-secondary)]">This initial password cannot be viewed again. Confirm that you have copied it before closing.</p><div className="flex justify-end gap-3"><Button onClick={() => setIsCredentialCloseWarningOpen(false)} variant="secondary">Go back</Button><Button onClick={clearCredential}>Close without copying</Button></div></div>
      </Dialog>
    </>
  );
}

function OwnerTableRow({ onDeactivate, onEdit, onReactivate, onView, owner }: { onDeactivate: () => void; onEdit: () => void; onReactivate: () => void; onView: () => void; owner: OrganizationOwner }) {
  return <tr className="hover:bg-[var(--color-surface-hover)]"><td className="px-4 py-3"><p className="font-semibold">{owner.name}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{owner.email}</p></td><td className="px-4 py-3 text-[var(--color-text-secondary)]">{owner.phone ?? "Not available"}</td><td className="px-4 py-3"><OwnerStatusBadge status={owner.status} /></td><td className="px-4 py-3 text-[var(--color-text-secondary)]">{owner.createdBy ? owner.createdBy.name : "Not available"}</td><td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDateTime(owner.lastLoginAt)}</td><td className="px-4 py-3 text-[var(--color-text-secondary)]">{owner.passwordChangedAt ? formatDate(owner.passwordChangedAt) : "Not changed"}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Button aria-label={`View ${owner.name}`} onClick={onView} variant="ghost"><Eye className="size-[var(--icon-sm)]" /></Button><Button aria-label={`Edit ${owner.name}`} onClick={onEdit} variant="secondary"><Pencil className="size-[var(--icon-sm)]" /></Button><OwnerStatusAction onDeactivate={onDeactivate} onReactivate={onReactivate} owner={owner} /></div></td></tr>;
}

function OwnerMobileCard({ onDeactivate, onEdit, onReactivate, onView, owner }: { onDeactivate: () => void; onEdit: () => void; onReactivate: () => void; onView: () => void; owner: OrganizationOwner }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{owner.name}</p><p className="mt-1 break-all text-sm text-[var(--color-text-secondary)]">{owner.email}</p></div><OwnerStatusBadge status={owner.status} /></div><div className="mt-4 grid gap-2 text-sm"><p><span className="text-[var(--color-text-secondary)]">Phone:</span> {owner.phone ?? "Not available"}</p><p><span className="text-[var(--color-text-secondary)]">Last login:</span> {formatDateTime(owner.lastLoginAt)}</p></div><div className="mt-4 flex flex-wrap gap-2"><Button className="gap-1" onClick={onView} variant="secondary"><Eye className="size-3.5" />View</Button><Button className="gap-1" onClick={onEdit} variant="secondary"><Pencil className="size-3.5" />Edit</Button><OwnerStatusAction onDeactivate={onDeactivate} onReactivate={onReactivate} owner={owner} /></div></div>;
}

function OwnerStatusAction({ onDeactivate, onReactivate, owner }: { onDeactivate: () => void; onReactivate: () => void; owner: OrganizationOwner }) {
  if (owner.status === "SUSPENDED") return <span className="text-xs font-medium text-[var(--color-text-secondary)]">Suspension workflow required</span>;
  if (owner.status === "PENDING_SETUP") return <span className="text-xs font-medium text-[var(--color-text-secondary)]">Status change unavailable</span>;
  const active = owner.status === "ACTIVE";
  return <Button aria-label={`${active ? "Deactivate" : "Reactivate"} ${owner.name}`} className="gap-1" onClick={active ? onDeactivate : onReactivate} variant="secondary">{active ? <ToggleLeft className="size-3.5" /> : <ToggleRight className="size-3.5" />}{active ? "Deactivate" : "Reactivate"}</Button>;
}

function OwnerStatusBadge({ status }: { status: OrganizationOwnerStatus }) {
  const colors: Record<OrganizationOwnerStatus, string> = { ACTIVE: "bg-[var(--green-100)] text-[var(--green-700)]", INACTIVE: "bg-[var(--gray-100)] text-[var(--gray-700)]", PENDING_SETUP: "bg-[var(--orange-100)] text-[var(--orange-700)]", SUSPENDED: "bg-[var(--red-100)] text-[var(--red-700)]" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status]}`}>{ownerStatusLabel(status)}</span>;
}

function OrganizationStatusBadge({ status }: { status: Organization["status"] }) {
  const active = status === "ACTIVE";
  return <span className={active ? "inline-flex rounded-full bg-[var(--green-100)] px-2.5 py-1 text-xs font-semibold text-[var(--green-700)]" : "inline-flex rounded-full bg-[var(--gray-100)] px-2.5 py-1 text-xs font-semibold text-[var(--gray-700)]"}>{active ? "Organization active" : "Organization inactive"}</span>;
}

function OwnerDetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-5 border-t border-[var(--color-divider)] pt-3 text-sm"><span className="text-[var(--color-text-secondary)]">{label}</span><span className="max-w-[65%] break-words text-right font-medium text-[var(--color-text)]">{value}</span></div>;
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2"><span className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</span><span className="break-all font-mono text-sm font-semibold text-[var(--color-text)]">{value}</span></div>;
}
