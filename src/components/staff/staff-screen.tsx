"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser, type AuthUser } from "@/lib/api/auth";
import { getStaff, staffQueryForUser, type Staff } from "@/lib/api/staff";
import { clearSession, getAccessToken, saveSession } from "@/lib/session";
import { useRouter } from "next/navigation";

export function StaffScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStaff = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/");
      return;
    }
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser(token);
      saveSession(token, currentUser);
      setUser(currentUser);
      const scope = staffQueryForUser(currentUser);
      if (!scope) {
        setStaff([]);
        setError("");
        return;
      }
      const response = await getStaff(token, { ...scope, search: search || undefined, limit: 100 });
      setStaff(response.data);
      setError("");
    } catch (apiError) {
      const message = apiError instanceof Error ? apiError.message : "Unable to load Staff.";
      if (/session|401/i.test(message)) {
        clearSession();
        router.replace("/");
        return;
      }
      setError(message);
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, [router, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStaff(), 250);
    return () => window.clearTimeout(timer);
  }, [loadStaff]);

  const scopeUnavailable = user?.role === "CRM_OWNER" || user?.role === "LEAD_CALLER";

  return <AppShell user={user}><div className="grid gap-[var(--section-gap)]"><div><h1 className="text-2xl font-bold text-[var(--color-text)]">Staff</h1><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Read-only Staff directory for your authorized scope.</p></div><Card className="p-[var(--space-4)]"><div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" /><Input aria-label="Search Staff" className="pl-10" onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or phone" type="search" value={search} /></label><Button disabled={isLoading || scopeUnavailable} onClick={() => void loadStaff()} variant="secondary"><RefreshCw className="size-[var(--icon-sm)]" />Refresh</Button></div></Card>{scopeUnavailable ? <Card className="grid min-h-56 place-items-center p-6 text-center"><div><UsersRound className="mx-auto size-10 text-[var(--color-primary)]" /><h2 className="mt-4 font-bold">Staff scope is not selected</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{user?.role === "CRM_OWNER" ? "Select an Organization and Branch in Settings to manage its Admins." : "Your role does not have access to the Staff directory."}</p></div></Card> : error ? <Card className="grid min-h-56 place-items-center p-6 text-center"><div><p className="font-medium text-[var(--color-danger)]" role="alert">{error}</p><Button className="mt-4" onClick={() => void loadStaff()} variant="secondary">Retry</Button></div></Card> : isLoading ? <Card className="grid min-h-56 place-items-center text-sm text-[var(--color-text-secondary)]">Loading Staff...</Card> : staff.length === 0 ? <Card className="grid min-h-56 place-items-center p-6 text-center"><div><UsersRound className="mx-auto size-10 text-[var(--color-primary)]" /><h2 className="mt-4 font-bold">No Staff records found</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Staff lifecycle management will be added separately.</p></div></Card> : <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs uppercase text-[var(--color-text-muted)]"><tr><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-[var(--color-divider)]">{staff.map((person) => <tr key={person.id}><td className="px-4 py-4"><p className="font-semibold">{person.fullName}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{person.email || "No email"}</p></td><td className="px-4 py-4">{person.role.replaceAll("_", " ")}</td><td className="px-4 py-4">{person.phone}</td><td className="px-4 py-4">{person.status === "ACTIVE" ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div></Card>}</div></AppShell>;
}
