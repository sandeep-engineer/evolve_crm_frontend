"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ChevronLeft, ChevronRight, Clipboard, Eye, Pencil, Plus, RefreshCw, Search, UserRoundCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/lib/api/auth";
import {
  BranchAdminApiError,
  createBranchAdmin,
  deactivateBranchAdmin,
  getBranchAdmin,
  listBranchAdmins,
  reactivateBranchAdmin,
  type BranchAdmin,
  type BranchAdminStatus,
  type CreateBranchAdminResponse,
  updateBranchAdmin,
} from "@/lib/api/branch-admins";
import type { Branch } from "@/lib/api/branches";
import { clearSession } from "@/lib/session";

const PAGE_SIZE = 10;
const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Pending setup", value: "PENDING_SETUP" },
];

type AdminForm = { name: string; email: string; phone: string; joiningDate: string };
const emptyForm: AdminForm = { name: "", email: "", phone: "", joiningDate: "" };

function formatDate(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function isIndianMobile(value: string) {
  return /^\+91[6-9]\d{9}$/.test(value);
}

function canManage(user: AuthUser) {
  return user.role === "CRM_OWNER" || user.role === "ORGANIZATION_OWNER";
}

export function BranchAdminManagement({
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
  const [admins, setAdmins] = useState<BranchAdmin[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BranchAdminStatus | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detail, setDetail] = useState<BranchAdmin | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [adminToChange, setAdminToChange] = useState<BranchAdmin | null>(null);
  const [credentials, setCredentials] = useState<CreateBranchAdminResponse | null>(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);
  const [isCredentialCloseConfirmOpen, setIsCredentialCloseConfirmOpen] = useState(false);
  const canCreate = user.role === "ORGANIZATION_OWNER";

  const messageForError = useCallback((apiError: unknown, fallback: string) => {
    if (apiError instanceof BranchAdminApiError && apiError.status === 401) {
      clearSession();
      router.replace("/");
      return "";
    }
    return apiError instanceof Error ? apiError.message : fallback;
  }, [router]);

  const loadAdmins = useCallback(async () => {
    if (!canManage(user)) return;
    setIsLoading(true);
    try {
      const response = await listBranchAdmins(token, branch.id, { page, limit: PAGE_SIZE, search, status });
      setAdmins(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
      setError("");
    } catch (apiError) {
      const message = messageForError(apiError, "Unable to load Branch Admins.");
      if (message) setError(message);
      setAdmins([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [branch.id, messageForError, page, search, status, token, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAdmins(), 0);
    return () => {
      window.clearTimeout(timer);
      setCredentials(null);
    };
  }, [loadAdmins]);

  function resetForm() {
    setForm(emptyForm);
    setFormError("");
    setIsCreateOpen(false);
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), joiningDate: form.joiningDate };
    if (!payload.name || !payload.email || !payload.phone || !payload.joiningDate) {
      setFormError("Name, email, Indian mobile number, and joining date are required.");
      return;
    }
    if (!isIndianMobile(payload.phone)) {
      setFormError("Use an Indian mobile number in +91XXXXXXXXXX format.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      const result = await createBranchAdmin(token, branch.id, payload);
      resetForm();
      setCredentials(result);
      setCredentialsCopied(false);
      await loadAdmins();
    } catch (apiError) {
      setFormError(messageForError(apiError, "Unable to create the Branch Admin."));
    } finally {
      setIsSaving(false);
    }
  }

  async function openDetail(admin: BranchAdmin) {
    setDetail(admin);
    setIsDetailOpen(true);
    setIsEditing(false);
    setFormError("");
    try {
      setDetail(await getBranchAdmin(token, branch.id, admin.userId));
    } catch (apiError) {
      const message = messageForError(apiError, "Unable to load Branch Admin details.");
      if (message) setError(message);
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), joiningDate: form.joiningDate };
    if (!payload.name || !payload.email || !payload.phone || !payload.joiningDate || !isIndianMobile(payload.phone)) {
      setFormError("Provide a name, email, +91 Indian mobile number, and joining date.");
      return;
    }
    setIsSaving(true);
    setFormError("");
    try {
      const updated = await updateBranchAdmin(token, branch.id, detail.userId, payload);
      setDetail(updated);
      setIsEditing(false);
      setNotice("Branch Admin updated.");
      await loadAdmins();
    } catch (apiError) {
      setFormError(messageForError(apiError, "Unable to update the Branch Admin."));
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus() {
    if (!adminToChange) return;
    setIsSaving(true);
    try {
      const updated = adminToChange.userStatus === "ACTIVE"
        ? await deactivateBranchAdmin(token, branch.id, adminToChange.userId)
        : await reactivateBranchAdmin(token, branch.id, adminToChange.userId);
      setAdminToChange(null);
      setDetail((current) => current?.userId === updated.userId ? updated : current);
      setNotice(updated.userStatus === "ACTIVE" ? "Branch Admin reactivated. They must sign in again." : "Branch Admin deactivated. Existing sessions were invalidated.");
      await loadAdmins();
    } catch (apiError) {
      const message = messageForError(apiError, "Unable to change Branch Admin status.");
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

  function startEdit() {
    if (!detail) return;
    setForm({ name: detail.name, email: detail.email, phone: detail.phone ?? "", joiningDate: detail.joiningDate.slice(0, 10) });
    setFormError("");
    setIsEditing(true);
  }

  return (
    <div className="grid gap-[var(--space-5)]">
      <div className="flex flex-col gap-4 border-b border-[var(--color-divider)] pb-[var(--space-4)] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button onClick={onClose} variant="ghost"><ChevronLeft className="size-[var(--icon-sm)]" />Back to Branches</Button>
          <h2 className="mt-3 text-xl font-bold text-[var(--color-text)]">Manage Admins</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{organizationName} · {branch.name}</p>
        </div>
        {canCreate ? <Button className="gap-2" onClick={() => { setForm(emptyForm); setFormError(""); setIsCreateOpen(true); }}><Plus className="size-[var(--icon-sm)]" />Add Branch Admin</Button> : null}
      </div>

      {notice ? <div className="rounded-[var(--radius-md)] border border-[var(--green-200)] bg-[var(--green-100)] px-4 py-3 text-sm font-medium text-[var(--green-700)]" role="status">{notice}</div> : null}
      <Card className="p-[var(--space-4)]"><div className="flex flex-col gap-3 lg:flex-row"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" /><Input aria-label="Search Branch Admins" className="w-full pl-10" onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, email or phone" type="search" value={searchInput} /></label><FilterSelect label="Admin status" onChange={(event) => { setStatus((event.target.value || undefined) as BranchAdminStatus | undefined); setPage(1); }} options={statusOptions} value={status || ""} /><Button disabled={isLoading} onClick={() => void loadAdmins()} variant="secondary"><RefreshCw className="size-[var(--icon-sm)]" />Refresh</Button></div></Card>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-divider)] px-[var(--space-5)] py-[var(--space-4)]"><div><h3 className="font-bold text-[var(--color-text)]">Branch Admins</h3><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{total} Admin{total === 1 ? "" : "s"}</p></div></div>
        {error ? <div className="grid min-h-48 place-items-center p-6 text-center"><div><p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{error}</p><Button className="mt-4" onClick={() => void loadAdmins()} variant="secondary">Retry</Button></div></div> : isLoading ? <div className="grid min-h-48 place-items-center text-sm text-[var(--color-text-secondary)]">Loading Branch Admins...</div> : admins.length === 0 ? <div className="grid min-h-48 place-items-center p-6 text-center"><div><UserRoundCog className="mx-auto size-9 text-[var(--color-primary)]" /><p className="mt-3 font-semibold">No Branch Admins have been created for this Branch.</p></div></div> : <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-left text-sm"><thead className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs uppercase text-[var(--color-text-muted)]"><tr><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joining</th><th className="px-4 py-3">Created by</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Password changed</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[var(--color-divider)]">{admins.map((admin) => <tr key={admin.userId}><td className="px-4 py-4"><p className="font-semibold">{admin.name}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{admin.email} · {admin.phone || "No phone"}</p></td><td className="px-4 py-4"><StatusPair admin={admin} /></td><td className="px-4 py-4">{formatDate(admin.joiningDate)}</td><td className="px-4 py-4">{admin.createdByUser?.name || "Not available"}</td><td className="px-4 py-4">{formatDate(admin.lastLoginAt)}</td><td className="px-4 py-4">{admin.passwordChangedAt ? formatDate(admin.passwordChangedAt) : "Not changed"}</td><td className="px-4 py-4 text-right"><Button aria-label={`View ${admin.name}`} onClick={() => void openDetail(admin)} variant="secondary"><Eye className="size-[var(--icon-sm)]" /></Button></td></tr>)}</tbody></table></div>}
        {totalPages > 1 ? <div className="flex items-center justify-between border-t border-[var(--color-divider)] px-5 py-4"><span className="text-sm text-[var(--color-text-secondary)]">Page {page} of {totalPages}</span><div className="flex gap-2"><Button aria-label="Previous Branch Admin page" disabled={page === 1} onClick={() => setPage((value) => value - 1)} variant="secondary"><ChevronLeft className="size-[var(--icon-sm)]" /></Button><Button aria-label="Next Branch Admin page" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} variant="secondary"><ChevronRight className="size-[var(--icon-sm)]" /></Button></div></div> : null}
      </Card>

      <Dialog className="max-w-lg" description="Create a Branch Admin for the selected Branch." isOpen={isCreateOpen} onClose={() => { if (!isSaving) resetForm(); }} title="Create Branch Admin"><form className="grid gap-4" onSubmit={submitCreate}><Input autoFocus label="Admin name" maxLength={120} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /><Input label="Login email" maxLength={150} onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} /><Input hint="Use +91XXXXXXXXXX" label="Indian mobile number" maxLength={13} onChange={(event) => setForm({ ...form, phone: event.target.value })} required value={form.phone} /><Input label="Joining date" onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} required type="date" value={form.joiningDate} />{formError ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{formError}</p> : null}<div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={resetForm} variant="secondary">Cancel</Button><Button disabled={isSaving} type="submit">{isSaving ? "Creating..." : "Create Branch Admin"}</Button></div></form></Dialog>
      <Dialog className="max-w-xl" description="Sanitized Branch Admin information." isOpen={isDetailOpen} onClose={() => { if (!isSaving) setIsDetailOpen(false); }} title={isEditing ? "Edit Branch Admin" : "Branch Admin details"}>{detail ? isEditing ? <form className="grid gap-4" onSubmit={saveEdit}><p className="rounded-[var(--radius-md)] bg-[var(--blue-100)] px-3 py-2 text-sm text-[var(--color-primary)]">Changing email or phone signs the Admin out of existing sessions.</p><Input label="Name" maxLength={120} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /><Input label="Email" maxLength={150} onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} /><Input label="Indian mobile number" onChange={(event) => setForm({ ...form, phone: event.target.value })} required value={form.phone} /><Input label="Joining date" onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} required type="date" value={form.joiningDate} />{formError ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{formError}</p> : null}<div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={() => setIsEditing(false)} variant="secondary">Cancel</Button><Button disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save changes"}</Button></div></form> : <AdminDetails admin={detail} canManage={canManage(user)} onDeactivate={() => setAdminToChange(detail)} onEdit={startEdit} /> : null}</Dialog>
      <Dialog className="max-w-lg" description="Initial credentials are displayed once after creation." isOpen={Boolean(credentials)} onClose={requestCloseCredentials} title="Save initial credentials">{credentials ? <div className="grid gap-4"><p className="rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--orange-100)] px-3 py-2 text-sm">This password cannot be viewed again after closing. Password change is optional but recommended.</p><AdminCredential label="Admin" value={credentials.user.name} /><AdminCredential label="Email" value={credentials.user.email} /><AdminCredential label="Phone" value={credentials.user.phone || "Not provided"} /><AdminCredential label="Branch" value={branch.name} /><AdminCredential label="Initial password" value={credentials.initialPassword} />{formError ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{formError}</p> : null}<div className="flex justify-end gap-3"><Button onClick={() => void copyCredentials()} variant="secondary"><Clipboard className="size-[var(--icon-sm)]" />{credentialsCopied ? "Copied" : "Copy credentials"}</Button><Button onClick={requestCloseCredentials}>Close</Button></div></div> : null}</Dialog>
      <Dialog className="max-w-md" description="Confirm closing the one-time credentials." isOpen={isCredentialCloseConfirmOpen} onClose={() => setIsCredentialCloseConfirmOpen(false)} title="Close without copying?"><div className="grid gap-5"><p className="text-sm text-[var(--color-text-secondary)]">The initial password cannot be viewed again after this dialog closes.</p><div className="flex justify-end gap-3"><Button onClick={() => setIsCredentialCloseConfirmOpen(false)} variant="secondary">Keep open</Button><Button onClick={() => { setIsCredentialCloseConfirmOpen(false); setCredentials(null); }}>Close permanently</Button></div></div></Dialog>
      <Dialog className="max-w-md" description="Confirm Branch Admin status change." isOpen={Boolean(adminToChange)} onClose={() => { if (!isSaving) setAdminToChange(null); }} title={adminToChange?.userStatus === "ACTIVE" ? "Deactivate Branch Admin" : "Reactivate Branch Admin"}>{adminToChange ? <div className="grid gap-5"><p className="text-sm leading-6 text-[var(--color-text-secondary)]">{adminToChange.userStatus === "ACTIVE" ? <>Deactivate <strong>{adminToChange.name}</strong>? Login access and Staff status will be deactivated, and existing sessions will be invalidated.</> : <>Reactivate <strong>{adminToChange.name}</strong>? They must sign in again; old sessions are not restored.</>}</p><div className="flex justify-end gap-3"><Button disabled={isSaving} onClick={() => setAdminToChange(null)} variant="secondary">Cancel</Button><Button disabled={isSaving} onClick={() => void changeStatus()}>{isSaving ? "Saving..." : adminToChange.userStatus === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button></div></div> : null}</Dialog>
    </div>
  );
}

function StatusPair({ admin }: { admin: BranchAdmin }) {
  const active = admin.userStatus === "ACTIVE" && admin.staffStatus === "ACTIVE";
  return <span className={active ? "inline-flex rounded-full bg-[var(--green-100)] px-2 py-1 text-xs font-semibold text-[var(--green-700)]" : "inline-flex rounded-full bg-[var(--gray-100)] px-2 py-1 text-xs font-semibold text-[var(--gray-700)]"}>{active ? "Active" : "Inactive"}</span>;
}

function AdminDetails({ admin, canManage, onEdit, onDeactivate }: { admin: BranchAdmin; canManage: boolean; onEdit: () => void; onDeactivate: () => void }) {
  return <div className="grid gap-3 text-sm"><AdminCredential label="User ID" value={admin.userId} /><AdminCredential label="Staff ID" value={admin.staffId} /><AdminCredential label="Name" value={admin.name} /><AdminCredential label="Email" value={admin.email} /><AdminCredential label="Phone" value={admin.phone || "Not provided"} /><AdminCredential label="Role" value="Branch Admin" /><AdminCredential label="Status" value={`${admin.userStatus} / ${admin.staffStatus}`} /><AdminCredential label="Organization" value={admin.organizationId} /><AdminCredential label="Branch" value={admin.branch.name} /><AdminCredential label="Joining date" value={formatDate(admin.joiningDate)} /><AdminCredential label="Created by" value={admin.createdByUser?.name || "Not available"} /><AdminCredential label="Created" value={formatDate(admin.createdAt)} /><AdminCredential label="Updated" value={formatDate(admin.updatedAt)} /><AdminCredential label="Last login" value={formatDate(admin.lastLoginAt)} /><AdminCredential label="Password changed" value={admin.passwordChangedAt ? formatDate(admin.passwordChangedAt) : "Not changed"} />{canManage ? <div className="mt-2 flex justify-end gap-3"><Button onClick={onEdit} variant="secondary"><Pencil className="size-[var(--icon-sm)]" />Edit</Button><Button onClick={onDeactivate} variant="secondary">{admin.userStatus === "ACTIVE" ? "Deactivate" : "Reactivate"}</Button></div> : null}</div>;
}

function AdminCredential({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[var(--color-divider)] pb-2"><span className="text-[var(--color-text-secondary)]">{label}</span><span className="break-all text-right font-medium text-[var(--color-text)]">{value}</span></div>;
}
