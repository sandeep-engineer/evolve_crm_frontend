"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  FileText,
  Grid2X2,
  Home,
  Inbox,
  ListChecks,
  MapPin,
  Menu,
  Search,
  Settings,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Button } from "@/components/ui/button";
import { clearSession } from "@/lib/session";
import type { AuthUser } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  user: AuthUser | null;
};

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Inbox", href: "/inbox", icon: Inbox, count: 7 },
  { label: "Members", href: "/members", icon: UsersRound },
  { label: "Leads", href: "/leads", icon: UserRound, count: 18 },
  { label: "Plans Handling", href: "/plans", icon: WalletCards },
  { label: "Batches", href: "/batches", icon: Grid2X2 },
  { label: "Staff", href: "/staff", icon: UsersRound },
  { label: "Attendance Handling", href: "/attendance", icon: ListChecks },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  { label: "Income & Expense Reports", href: "/income-expense", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children, user }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const today = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  }).format(new Date());

  function logout() {
    clearSession();
    router.push("/");
  }

  return (
    <div className="min-h-dvh bg-[var(--color-canvas)] text-[var(--color-text)]">
      <aside className="fixed inset-y-0 left-0 z-[var(--z-sticky)] hidden w-[var(--sidebar-width)] border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex lg:flex-col">
        <div className="flex h-[var(--topbar-height)] items-center border-b border-[var(--color-divider)] px-[var(--space-6)]">
          <BrandLockup compact />
        </div>

        <nav className="flex-1 space-y-1 px-[var(--space-3)] py-[var(--space-4)]">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                className={cn(
                  "flex h-11 w-full items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] text-left text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
                  isActive &&
                    "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
                )}
                href={item.href}
                key={item.label}
              >
                <Icon className="size-[var(--icon-sm)]" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.count ? (
                  <span className="rounded-[var(--radius-full)] bg-[var(--blue-100)] px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                    {item.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="m-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-[var(--space-3)]">
          <div className="flex items-center gap-[var(--space-3)]">
            <div className="grid size-10 place-items-center rounded-[var(--radius-full)] bg-[var(--color-primary)] text-sm font-bold text-[var(--color-text-inverse)]">
              {initials(user?.name || "User")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                {user?.name || "Evolve User"}
              </p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">
                {formatRole(user?.role)}
              </p>
            </div>
          </div>
          <button
            className="mt-[var(--space-3)] h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            onClick={logout}
            type="button"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[var(--sidebar-width)]">
        <header className="sticky top-0 z-[var(--z-sticky)] flex h-[var(--topbar-height)] items-center gap-[var(--space-4)] border-b border-[var(--color-border)] bg-[rgb(255_255_255_/_88%)] px-[var(--space-4)] backdrop-blur lg:px-[var(--content-padding-x)]">
          <button
            aria-label="Open navigation"
            className="grid size-10 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] lg:hidden"
            type="button"
          >
            <Menu className="size-[var(--icon-md)]" />
          </button>
          <div className="hidden lg:block">
            <Menu className="size-[var(--icon-md)] text-[var(--color-text-secondary)]" />
          </div>

          <label className="relative hidden h-[var(--control-height-lg)] min-w-0 max-w-[32rem] flex-1 items-center md:flex">
            <Search className="pointer-events-none absolute left-4 size-[var(--icon-sm)] text-[var(--color-text-muted)]" />
            <input
              className="h-full w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-11 pr-16 text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
              placeholder="Search members, leads, plans, staff..."
              type="search"
            />
            <span className="absolute right-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
              ⌘K
            </span>
          </label>

          <div className="ml-auto flex items-center gap-[var(--space-3)]">
            <Button className="hidden gap-2 md:inline-flex" variant="secondary">
              <MapPin className="size-[var(--icon-sm)]" />
              Andheri West
              <ChevronDown className="size-[var(--icon-sm)]" />
            </Button>
            <Button className="hidden gap-2 xl:inline-flex" variant="ghost">
              <CalendarDays className="size-[var(--icon-sm)]" />
              {today}
            </Button>
            <button
              aria-label="Notifications"
              className="relative grid size-10 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]"
              type="button"
            >
              <Bell className="size-[var(--icon-sm)]" />
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-[var(--color-text-inverse)]">
                12
              </span>
            </button>
            <div className="hidden items-center gap-[var(--space-3)] md:flex">
              <div className="grid size-10 place-items-center rounded-[var(--radius-full)] bg-[var(--color-primary)] text-sm font-bold text-[var(--color-text-inverse)]">
                {initials(user?.name || "User")}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user?.name || "Evolve User"}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {formatRole(user?.role)}
                </p>
              </div>
              <ChevronDown className="size-[var(--icon-sm)] text-[var(--color-text-muted)]" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[var(--content-max-width)] px-[var(--space-4)] py-[var(--content-padding-y)] lg:px-[var(--content-padding-x)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRole(role?: string) {
  if (!role) return "Receptionist";
  return role
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
}
