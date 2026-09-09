"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ChevronLeft, ChevronRight, Clipboard, Eye, Pencil, Plus, RefreshCw, Search, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import type { AuthUser, UserStatus } from "@/lib/api/auth";
import type { Branch } from "@/lib/api/branches";
import {
  BranchPersonnelApiError,
  createBranchPersonnel,
  deactivateBranchPersonnel,
  getBranchPersonnel,
  listBranchPersonnel,
  reactivateBranchPersonnel,
  updateBranchPersonnel,
  type BranchPersonnel,
  type PersonnelKind,
  type PersonnelProvisionResponse,
} from "@/lib/api/branch-personnel";
import { clearSession } from "@/lib/session";

const PAGE_SIZE = 10;
const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Pending setup", value: "PENDING_SETUP" },
];

type PersonnelForm = { name: string; email: string; phone: string; joiningDate: string };
const emptyForm: PersonnelForm = { name: "", email: "", phone: "", joiningDate: "" };

const personnelTabs: Array<{ kind: PersonnelKind; label: string; singular: string; role: "RECEPTIONIST" | "LEAD_CALLER" }> = [
  { kind: "receptionists", label: "Receptionists", singular: "Receptionist", role: "RECEPTIONIST" },
  { kind: "callers", label: "Lead Callers", singular: "Lead Caller", role: "LEAD_CALLER" },
];

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function isIndianMobile(value: string) {
  return /^\+91[6-9]\d{9}$/.test(value);
}

function canManagePersonnel(user: AuthUser) {
  return user.role === "CRM_OWNER" || user.role === "ORGANIZATION_OWNER" || user.role === "BRANCH_ADMIN";
}

function canCreatePersonnel(user: AuthUser) {
  return user.role === "ORGANIZATION_OWNER" || user.role === "BRANCH_ADMIN";
}

export function BranchPersonnelManagement({
  branch,
  organizationName,
  token,
  user,
  onClose,
}: {
  branch: Branch;
  organizationName: string;
  token: string;
  user: AuthUser;
  onClose: () => void;
}) {
  const router = useRouter();
  const requestId = useRef(0);
  const [activeKind, setActiveKind] = useState<PersonnelKind>("receptionists");
  const [personnel, setPersonnel] = useState<BranchPersonnel[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<PersonnelForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detail, setDetail] = useState<BranchPersonnel | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [personToChange, setPersonToChange] = useState<BranchPersonnel | null>(null);
  const [credentials, setCredentials] = useState<PersonnelProvisionResponse | null>(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);
  const [isCredentialCloseConfirmOpen, setIsCredentialCloseConfirmOpen] = useState(false);
  const currentTab = personnelTabs.find((tab) => tab.kind === activeKind) ?? personnelTabs[0];
  const canCreate = canCreatePersonnel(user);

  const handleApiError = useCallback((apiError: unknown, fallback: string) => {
    if (apiError instanceof BranchPersonnelApiError && apiError.status === 401) {
      clearSession();
      router.replace("/");
      return "";
    }
    return apiError instanceof Error ? apiError.message : fallback;
  }, [router]);

  const loadPersonnel = useCallback(async () => {
    if (!token || !canManagePersonnel(user)) return;
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    try {
      const response = await listBranchPersonnel(token, branch.id, activeKind, { page, limit: PAGE_SIZE, search, status });
      if (currentRequestId !== requestId.current) return;
      setPersonnel(response.data);
      setMeta({ total: response.meta.total, totalPages: response.meta.totalPages });
      setError("");
    } catch (apiError) {
      if (currentRequestId !== requestId.current) return;
      const message = handleApiError(apiError, `Unable to load ${currentTab.label.toLowerCase()}.`);
      if (message) setError(message);
      setPersonnel([]);
      setMeta({ total: 0, totalPages: 0 });
    } finally {
      if (currentRequestId === requestId.current) setIsLoading(false);
    }
  }, [activeKind, branch.id, currentTab.label, handleApiError, page, search, status, token, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPersonnel(), 0);
    return () => {
      window.clearTimeout(timer);
      requestId.current += 1;
    };
  }, [loadPersonnel]);

  function selectTab(kind: PersonnelKind) {
    if (kind === activeKind) return;
    setCredentials(null);
    setCredentialsCopied(false);
    setDetail(null);
    setIsDetailOpen(false);
    setIsEditing(false);
    setPage(1);
    setSearchInput("");
    setSearch("");
    setStatus(undefined);
    setActiveKind(kind);
    setError("");
    setNotice("");
  }

  function resetForm() {
    setForm(emptyForm);
    setFormError("");
    setIsCreateOpen(false);
  }

  function validateForm() {
    const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), joiningDate: form.joiningDate };
    if (!payload.name || !payload.email || !payload.phone || !payload.joiningDate) return { error: "Name, email, Indian mobile number, and joining date are required." };
    if (!/^\S+@\S+\.\S+$/.test(payload.email)) return { error: "Enter a valid email address." };
    if (!isIndianMobile(payload.phone)) return { error: "Use an Indian mobile number in +91XXXXXXXXXX format." };
    if (Number.isNaN(new Date(`${payload.joiningDate}T00:00:00`).getTime())) return { error: "Enter a valid joining date." };
    return { payload };
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateForm();
    if ("error" in result) {
      setFormError(result.error ?? "Please check the personnel details.");
      return;
    }
    setIsSaving(true);
    setFormError("");
    try {
      const provisioned = await createBranchPersonnel(token, branch.id, activeKind, result.payload);
      resetForm();
      setCredentials(provisioned);
      setCredentialsCopied(false);
      await loadPersonnel();
    } catch (apiError) {
      setFormError(handleApiError(apiError, `Unable to create the ${currentTab.singular}.`));
    } finally {
      setIsSaving(false);
    }
  }

  async function openDetail(person: BranchPersonnel) {
    setDetail(person);
    setIsDetailOpen(true);
    setIsEditing(false);
    setFormError("");
    try {
      const latest = await getBranchPersonnel(token, branch.id, activeKind, person.userId);
      setDetail((current) => current?.userId === person.userId ? latest : current);
    } catch (apiError) {
      const message = handleApiError(apiError, `Unable to load ${currentTab.singular} details.`);
      if (message) setError(message);
    }
  }

  function startEdit() {
    if (!detail) return;
    setForm({ name: detail.name, email: detail.email, phone: detail.phone ?? "", joiningDate: detail.joiningDate.slice(0, 10) });
    setFormError("");
    setIsEditing(true);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const result = validateForm();
    if ("error" in result) {
      setFormError(result.error ?? "Please check the personnel details.");
      return;
    }
    setIsSaving(true);
    setFormError("");
    try {
      const updated = await updateBranchPersonnel(token, branch.id, activeKind, detail.userId, result.payload);
      setDetail(updated);
      setIsEditing(false);
      setNotice(`${currentTab.singular} updated. Existing sessions are invalidated if email or phone changed.`);
      await loadPersonnel();
    } catch (apiError) {
      setFormError(handleApiError(apiError, `Unable to update the ${currentTab.singular}.`));
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus() {
    if (!personToChange) return;
    setIsSaving(true);
    try {
      const isActive = personToChange.userStatus === "ACTIVE";
      const updated = isActive
        ? await deactivateBranchPersonnel(token, branch.id, activeKind, personToChange.userId)
        : await reactivateBranchPersonnel(token, branch.id, activeKind, personToChange.userId);
      setPersonToChange(null);
      setDetail((current) => current?.userId === updated.userId ? updated : current);
      setNotice(updated.userStatus === "ACTIVE" ? `${currentTab.singular} reactivated. They must sign in again.` : `${currentTab.singular} deactivated. Existing sessions were invalidated.`);
      await loadPersonnel();
    } catch (apiError) {
      const message = handleApiError(apiError, `Unable to change ${currentTab.singular} status.`);
      if (message) setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function copyCredentials() {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(`Email: ${credentials.user.email}\nPhone: ${credentials.user.phone ?? ""}\nInitial password: ${credentials.initialPassword}`);
      setCredentialsCopied(true);
    } catch {
      setFormError("Unable to copy credentials. Copy them manually before closing this dialog.");
    }
  }

  function requestCloseCredentials() {
    if (credentialsCopied) {
      setCredentials(null);
      return;
    }
    setIsCredentialCloseConfirmOpen(true);
  }

  return (
    <div className="grid gap-[var(--space-5)]">
      <div className="flex flex-col gap-4 border-b border-[var(--color-divider)] pb-[var(--space-4)] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button onClick={onClose} variant="ghost"><ChevronLeft className="size-[var(--icon-sm)]" />Back to Branches</Button>
          <h2 className="mt-3 text-xl font-bold text-[var(--color-text)]">Manage Personnel</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{organizationName} · {branch.name}</p>
        </div>
        {canCreate ? <Button className="gap-2" onClick={() => { setForm(emptyForm); setFormError(""); setIsCreateOpen(true); }}><Plus className="size-[var(--icon-sm)]" />Add {currentTab.singular}</Button> : null}
      </div>

      <div aria-label="Personnel roles" className="flex gap-1 border-b border-[var(--color-divider)]" role="tablist">
        {personnelTabs.map((tab) => <button aria-controls={`${tab.kind}-panel`} aria-selected={tab.kind === activeKind} className={tab.kind === activeKind ? "border-b-2 border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]" : "border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"} id={`${tab.kind}-tab`} key={tab.kind} onClick={() => selectTab(tab.kind)} role="tab" type="button">{tab.label}</button>)}
      </div>

      {notice ? <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--green-200)] bg-[var(--green-100)] px-4 py-3 text-sm font-medium text-[var(--green-700)]" role="status"><span>{notice}</span><button className="text-xs underline" onClick={() => setNotice("")} type="button">Dismiss</button></div> : null}

      <Card className="p-[var(--space-4)]"><div className="flex flex-col gap-3 lg:flex-row"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" /><Input aria-label={`Search ${currentTab.label}`} className="w-full pl-10" onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, email or phone" type="search" value={searchInput} /></label><FilterSelect label="Personnel status" onChange={(event) => { setStatus((event.target.value || undefined) as UserStatus | undefined); setPage(1); }} options={statusOptions} value={status || ""} /><Button disabled={isLoading} onClick={() => void loadPersonnel()} variant="secondary"><RefreshCw className="size-[var(--icon-sm)]" />Refresh</Button></div></Card>

      <Card className="overflow-hidden" id={`${activeKind}-panel`} role="tabpanel" aria-labelledby={`${activeKind}-tab`}>
        <div className="flex items-center justify-between border-b border-[var(--color-divider)] px-[var(--space-5)] py-[var(--space-4)]"><div><h3 className="font-bold text-[var(--color-text)]">{currentTab.label}</h3><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{meta.total} {currentTab.singular}{meta.total === 1 ? "" : "s"}</p></div></div>
        {error ? <div className="grid min-h-48 place-items-center p-6 text-center"><div><p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{error}</p><Button className="mt-4" onClick={() => void loadPersonnel()} variant="secondary">Retry</Button></div></div> : isLoading ? <div className="grid min-h-48 place-items-center text-sm text-[var(--color-text-secondary)]">Loading {currentTab.label}...</div> : personnel.length === 0 ? <div className="grid min-h-48 place-items-center p-6 text-center"><div><UsersRound className="mx-auto size-9 text-[var(--color-primary)]" /><p className="mt-3 font-semibold">No {currentTab.label.toLowerCase()} have been created for this Branch.</p></div></div> : <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs uppercase text-[var(--color-text-muted)]"><tr><th className="px-4 py-3">Person</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joining</th><th className="px-4 py-3">Created by</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[var(--color-divider)]">{personnel.map((person) => <tr key={person.userId}><td className="px-4 py-4"><p className="font-semibold">{person.name}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{person.email} · {person.phone || "No phone"}</p></td><td className="px-4 py-4"><StatusPill person={person} /></td><td className="px-4 py-4">{formatDate(person.joiningDate)}</td><td className="px-4 py-4">{person.createdByUser?.name || "Not available"}</td><td className="px-4 py-4">{formatDate(person.updatedAt)}</td><td className="px-4 py-4 text-right"><Button aria-label={`View ${person.name}`} onClick={() => void openDetail(person)} variant="secondary"><Eye className="size-[var(--icon-sm)]" /></Button></td></tr>)}</tbody></table></div>}
        {meta.totalPages > 1 ? <div className="flex items-center justify-between border-t border-[var(--color-divider)] px-5 py-4"><span className="text-sm text-[var(--color-text-secondary)]">Page {page} of {meta.totalPages}</span><div className="flex gap-2"><Button aria-label="Previous personnel page" disabled={page === 1} onClick={() => setPage((value) => value - 1)} variant="secondary"><ChevronLeft className="size-[var(--icon-sm)]" /></Button><Button aria-label="Next personnel page" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)} variant="secondary"><ChevronRight className="size-[var(--icon-sm)]" /></Button></div></div> : null}
      </Card>

      <Dialog className="max-w-lg" description={`Create a ${currentTab.singular} for the selected Branch.`} isOpen={isCreateOpen} onClose={() => { if (!isSaving) resetForm(); }} title={`Create ${currentTab.singular}`}><PersonnelForm form={form} formError={formError} isSaving={isSaving} onCancel={resetForm} onChange={setForm} onSubmit={submitCreate} submitLabel={`Create ${currentTab.singular}`} /></Dialog>

      <Dialog className="max-w-xl" description={`Sanitized ${currentTab.singular} information.`} isOpen={isDetailOpen} onClose={() => { if (!isSaving) setIsDetailOpen(false); }} title={isEditing ? `Edit ${currentTab.singular}` : `${currentTab.singular} details`}>
        {detail ? isEditing ? <><p className="mb-4 rounded-[var(--radius-md)] bg-[var(--blue-100)] px-3 py-2 text-sm text-[var(--color-primary)]">Changing email or phone signs this person out of existing sessions.</p><PersonnelForm form={form} formError={formError} isSaving={isSaving} onCancel={() => setIsEditing(false)} onChange={setForm} onSubmit={saveEdit} submitLabel="Save changes" /></> : <PersonnelDetails person={detail} roleLabel={currentTab.singular} onDeactivate={() => setPersonToChange(detail)} onEdit={startEdit} /> : null}
      </Dialog>

      <Dialog className="max-w-lg" description="Initial credentials are displayed once after creation." isOpen={Boolean(credentials)} onClose={requestCloseCredentials} title="Save initial credentials">
        {credentials ? <div className="grid gap-4"><p className="rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--orange-100)] px-3 py-2 text-sm">This generated password works immediately. Password change is optional and can be done later through the existing change-password flow. It cannot be viewed again after closing.</p><DetailRow label="Role" value={currentTab.singular} /><DetailRow label="Name" value={credentials.user.name} /><DetailRow label="Email" value={credentials.user.email} /><DetailRow label="Phone" value={credentials.user.phone || "Not provided"} /><DetailRow label="Branch" value={branch.name} /><DetailRow label="Initial password" value={credentials.initialPassword} />{formError ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{formError}</p> : null}<div className="flex justify-end gap-3"><Button onClick={() => void copyCredentials()} variant="secondary"><Clipboard className="size-[var(--icon-sm)]" />{credentialsCopied ? "Copied" : "Copy credentials"}</Button><Button onClick={requestCloseCredentials}>Close</Button></div></div> : null}
      </Dialog>

      <Dialog className="max-w-md" description="Confirm closing the one-time credentials." isOpen={isCredentialCloseConfirmOpen} onClose={() => setIsCredentialCloseConfirmOpen(false)} title="Close without copying?"><div className="grid gap-5"><p className="text-sm text-[var(--color-text-secondary)]">The initial password cannot be viewed again after this dialog closes.</p><div className="flex justify-end gap-3"><Button onClick={() => setIsCredentialCloseConfirmOpen(false)} variant="secondary">Keep open</Button><Button onClick={() => { setIsCredentialCloseConfirmOpen(false); setCredentials(null); }}>Close permanently</Button></div></div></Dialog>

      <Dialog className="max-w-md" description={`Confirm ${currentTab.singular} status change.`} isOpen={Boolean(personToChange)} onClose={() => { if (!isSaving) setPersonToChange(null); }} title={personToChange?.userStatus === "ACTIVE" ? `Deactivate ${currentTab.singular}` : `Reactivate ${currentTab.singular}`}>
        {personToChange ? <div className="grid gap-5"><p className="text-sm leading-6 text-[var(--color-text-secondary)]">{personToChange.userStatus === "ACTIVE" ? <>Deactivate <strong className="text-[var(--color-text)]">{personToChange.name}</strong>? This prevents login, preserves historical records, and does not delete the User or Staff record.</> : <>Reactivate <strong className="text-[var(--color-text)]">{personToChange.name}</strong>? They must sign in again; old sessions are not restored.</>}</p><div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={() => setPersonToChange(null)} variant="secondary">Cancel</Button><Button disabled={isSaving} onClick={() => void changeStatus()}>{isSaving ? "Saving..." : personToChange.userStatus === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button></div></div> : null}
      </Dialog>
    </div>
  );
}

function PersonnelForm({ form, formError, isSaving, onCancel, onChange, onSubmit, submitLabel }: { form: PersonnelForm; formError: string; isSaving: boolean; onCancel: () => void; onChange: (form: PersonnelForm) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitLabel: string }) {
  return <form className="grid gap-4" onSubmit={onSubmit}><Input autoFocus label="Name" maxLength={120} onChange={(event) => onChange({ ...form, name: event.target.value })} required value={form.name} /><Input label="Login email" maxLength={150} onChange={(event) => onChange({ ...form, email: event.target.value })} required type="email" value={form.email} /><Input hint="Use +91XXXXXXXXXX" label="Indian mobile number" maxLength={13} onChange={(event) => onChange({ ...form, phone: event.target.value })} required value={form.phone} /><Input label="Joining date" onChange={(event) => onChange({ ...form, joiningDate: event.target.value })} required type="date" value={form.joiningDate} />{formError ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{formError}</p> : null}<div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={onCancel} variant="secondary">Cancel</Button><Button disabled={isSaving} type="submit">{isSaving ? "Saving..." : submitLabel}</Button></div></form>;
}

function StatusPill({ person }: { person: BranchPersonnel }) {
  const active = person.userStatus === "ACTIVE" && person.staffStatus === "ACTIVE";
  return <span className={active ? "inline-flex rounded-full bg-[var(--green-100)] px-2 py-1 text-xs font-semibold text-[var(--green-700)]" : "inline-flex rounded-full bg-[var(--gray-100)] px-2 py-1 text-xs font-semibold text-[var(--gray-700)]"}>{active ? "Active" : "Inactive"}</span>;
}

function PersonnelDetails({ person, roleLabel, onDeactivate, onEdit }: { person: BranchPersonnel; roleLabel: string; onDeactivate: () => void; onEdit: () => void }) {
  return <div className="grid gap-3 text-sm"><DetailRow label="User ID" value={person.userId} /><DetailRow label="Staff ID" value={person.staffId} /><DetailRow label="Name" value={person.name} /><DetailRow label="Email" value={person.email} /><DetailRow label="Phone" value={person.phone || "Not provided"} /><DetailRow label="Role" value={roleLabel} /><DetailRow label="Status" value={`${person.userStatus} / ${person.staffStatus}`} /><DetailRow label="Organization" value={person.organizationId} /><DetailRow label="Branch" value={person.branch.name} /><DetailRow label="Joining date" value={formatDate(person.joiningDate)} /><DetailRow label="Created by" value={person.createdByUser?.name || "Not available"} /><DetailRow label="Created" value={formatDate(person.createdAt)} /><DetailRow label="Updated" value={formatDate(person.updatedAt)} /><div className="mt-2 flex justify-end gap-3"><Button onClick={onEdit} variant="secondary"><Pencil className="size-[var(--icon-sm)]" />Edit</Button><Button onClick={onDeactivate} variant="secondary">{person.userStatus === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button></div></div>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[var(--color-divider)] pb-2"><span className="text-[var(--color-text-secondary)]">{label}</span><span className="break-all text-right font-medium text-[var(--color-text)]">{value}</span></div>;
}
