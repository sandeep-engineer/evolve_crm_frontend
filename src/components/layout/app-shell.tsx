"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Building2,
  FileText,
  Grid2X2,
  Home,
  Inbox,
  ListChecks,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Search,
  Settings,
  UserPlus,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Button } from "@/components/ui/button";
import { getBranches, type Branch } from "@/lib/api/branches";
import { AuthApiError, getCurrentUser, type AuthUser } from "@/lib/api/auth";
import { getLeads } from "@/lib/api/leads";
import { getMembers } from "@/lib/api/members";
import { getPlans } from "@/lib/api/plans";
import { getStaff } from "@/lib/api/staff";
import { clearSession, getAccessToken, saveSession } from "@/lib/session";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  user: AuthUser | null;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  countKey?: "inbox" | "leads" | "members" | "staff";
  roles?: Array<AuthUser["role"]>;
};

const navigation: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Organizations", href: "/organizations", icon: Building2, roles: ["CRM_OWNER"] },
  { label: "Inbox", href: "/inbox", icon: Inbox, countKey: "inbox" },
  { label: "Members", href: "/members", icon: UsersRound, countKey: "members" },
  { label: "Leads", href: "/leads", icon: UserRound, countKey: "leads" },
  { label: "Plans Handling", href: "/plans", icon: WalletCards },
  { label: "Batches", href: "/batches", icon: Grid2X2 },
  { label: "Staff", href: "/staff", icon: UsersRound, countKey: "staff" },
  { label: "Attendance Handling", href: "/attendance", icon: ListChecks },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  { label: "Income & Expense Reports", href: "/income-expense", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

type NavigationCountKey = NonNullable<NavigationItem["countKey"]>;

type SearchItem = {
  href: string;
  label: string;
  meta: string;
  type: "Member" | "Lead" | "Plan" | "Staff";
};

const BRANCH_KEY = "fitcrm.selectedBranchId";

const fallbackNotifications = [
  {
    icon: CircleAlert,
    title: "4 overdue follow-ups",
    description: "Leads need action today",
    href: "/leads",
  },
  {
    icon: UserPlus,
    title: "3 new enquiries",
    description: "Review and assign owners",
    href: "/inbox",
  },
  {
    icon: CalendarDays,
    title: "2 memberships renewing",
    description: "Due in the next 24 hours",
    href: "/members",
  },
];

export function AppShell({ children, user }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [shellUser, setShellUser] = useState<AuthUser | null>(user);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<NavigationCountKey, number>>({
    inbox: 7,
    leads: 18,
    members: 0,
    staff: 0,
  });
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingShell, setIsLoadingShell] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const today = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  }).format(new Date());
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);
  const visibleSearchItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return searchItems
      .filter((item) =>
        [item.label, item.meta, item.type]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 8);
  }, [searchItems, searchQuery]);

  useEffect(() => {
    const token = getAccessToken();
    const storedBranchId = localStorage.getItem(BRANCH_KEY);
    if (!token) return;
    const accessToken = token;

    let isMounted = true;

    async function loadShell() {
      try {
        await Promise.resolve();
        if (!isMounted) return;
        setIsLoadingShell(true);
        const currentUser = await getCurrentUser(accessToken);
        if (!isMounted) return;

        setShellUser(currentUser);
        saveSession(accessToken, currentUser);

        const [branchResult, memberResult, leadResult, planResult, staffResult] =
          await Promise.allSettled([
            currentUser.role === "CRM_OWNER"
              ? Promise.resolve<Branch[]>([])
              : getBranches(accessToken),
            getMembers(accessToken),
            getLeads(accessToken),
            getPlans(accessToken),
            getStaff(accessToken),
          ]);
        if (!isMounted) return;

        if (branchResult.status === "fulfilled") {
          const latestBranches = branchResult.value;
          setBranches(latestBranches);
          const nextBranch =
            storedBranchId && latestBranches.some((branch) => branch.id === storedBranchId)
              ? storedBranchId
              : latestBranches[0]?.id ?? null;
          setSelectedBranchId(nextBranch);
          if (nextBranch) {
            localStorage.setItem(BRANCH_KEY, nextBranch);
          } else {
            localStorage.removeItem(BRANCH_KEY);
          }
        } else {
          setBranches([]);
          setSelectedBranchId(null);
          localStorage.removeItem(BRANCH_KEY);
        }

        const members = memberResult.status === "fulfilled" ? memberResult.value : [];
        const leads = leadResult.status === "fulfilled" ? leadResult.value : [];
        const plans = planResult.status === "fulfilled" ? planResult.value : [];
        const staff = staffResult.status === "fulfilled" ? staffResult.value : [];

        setCounts({
          inbox: 7,
          leads: leads.length || 18,
          members: members.length,
          staff: staff.length,
        });
        setSearchItems([
          ...members.map((member) => ({
            href: "/members",
            label: member.name,
            meta: member.phone,
            type: "Member" as const,
          })),
          ...leads.map((lead) => ({
            href: "/leads",
            label: lead.name,
            meta: lead.phone,
            type: "Lead" as const,
          })),
          ...plans.map((plan) => ({
            href: "/plans",
            label: plan.name,
            meta: `${plan.durationDays || plan.sessionsCount || "Custom"} ${plan.durationDays ? "days" : "sessions"}`,
            type: "Plan" as const,
          })),
          ...staff.map((staffMember) => ({
            href: "/staff",
            label: staffMember.fullName,
            meta: staffMember.phone,
            type: "Staff" as const,
          })),
        ]);
      } catch (error) {
        if (error instanceof AuthApiError && error.status === 401) {
          clearSession();
          router.replace("/");
        }
      } finally {
        if (isMounted) setIsLoadingShell(false);
      }
    }

    void loadShell();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function logout() {
    clearSession();
    router.push("/");
  }

  function chooseBranch(branchId: string) {
    setSelectedBranchId(branchId);
    localStorage.setItem(BRANCH_KEY, branchId);
    setIsBranchOpen(false);
  }

  function goToResult(href: string) {
    setSearchQuery("");
    router.push(href);
  }

  const navigationContent = (
    <>
      <div className="flex h-[var(--topbar-height)] items-center border-b border-[var(--color-divider)] px-[var(--space-6)]">
        <BrandLockup compact />
        <button
          aria-label="Close navigation"
          className="ml-auto grid size-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          type="button"
        >
          <X className="size-[var(--icon-md)]" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-[var(--space-3)] py-[var(--space-4)]">
        {navigation
          .filter((item) => !item.roles || (shellUser ? item.roles.includes(shellUser.role) : false))
          .map((item) => {
          const Icon = item.icon;
          const count = item.countKey ? counts[item.countKey] : undefined;
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
              onClick={() => setIsMobileNavOpen(false)}
            >
              <Icon className="size-[var(--icon-sm)]" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {count ? (
                <span className="rounded-[var(--radius-full)] bg-[var(--blue-100)] px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                  {count}
                </span>
              ) : null}
            </Link>
          );
          })}
      </nav>

      <div className="m-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-3)]">
          <div className="grid size-10 place-items-center rounded-[var(--radius-full)] bg-[var(--color-primary)] text-sm font-bold text-[var(--color-text-inverse)]">
            {initials(shellUser?.name || "User")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--color-text)]">
              {shellUser?.name || "Evolve User"}
            </p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {formatRole(shellUser?.role)}
            </p>
          </div>
        </div>
        <div className="relative mt-[var(--space-3)]">
          <button
            className="flex h-9 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            onClick={() => setIsBranchOpen((value) => !value)}
            type="button"
          >
              <span className="truncate">{selectedBranch?.name || "No branch available"}</span>
            <ChevronDown className="size-[var(--icon-sm)] shrink-0" />
          </button>
          {isBranchOpen ? (
            <BranchMenu
              branches={branches}
              onSelect={chooseBranch}
              selectedBranchId={selectedBranchId}
            />
          ) : null}
        </div>
        <button
          className="mt-[var(--space-3)] flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
          onClick={logout}
          type="button"
        >
          <LogOut className="size-[var(--icon-sm)]" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-[var(--color-canvas)] text-[var(--color-text)]">
      <aside className="fixed inset-y-0 left-0 z-[var(--z-sticky)] hidden w-[var(--sidebar-width)] border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex lg:flex-col">
        {navigationContent}
      </aside>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-[var(--z-modal)] lg:hidden">
          <button
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-[rgb(15_23_42_/_36%)]"
            onClick={() => setIsMobileNavOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
            {navigationContent}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[var(--sidebar-width)]">
        <header className="sticky top-0 z-[var(--z-sticky)] flex h-[var(--topbar-height)] items-center gap-[var(--space-4)] border-b border-[var(--color-border)] bg-[rgb(255_255_255_/_88%)] px-[var(--space-4)] backdrop-blur lg:px-[var(--content-padding-x)]">
          <button
            aria-label="Open navigation"
            className="grid size-10 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] lg:hidden"
            onClick={() => setIsMobileNavOpen(true)}
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
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search members, leads, plans, staff..."
              type="search"
              value={searchQuery}
            />
            <span className="absolute right-3 inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
              {isLoadingShell ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                "⌘K"
              )}
            </span>
            {searchQuery ? (
              <SearchResults
                items={visibleSearchItems}
                onSelect={goToResult}
                query={searchQuery}
              />
            ) : null}
          </label>

          <div className="ml-auto flex items-center gap-[var(--space-3)]">
            <div className="relative hidden md:block">
              <Button
                className="gap-2"
                onClick={() => setIsBranchOpen((value) => !value)}
                variant="secondary"
              >
              <MapPin className="size-[var(--icon-sm)]" />
                {selectedBranch?.name || "No branch available"}
              <ChevronDown className="size-[var(--icon-sm)]" />
            </Button>
              {isBranchOpen ? (
                <BranchMenu
                  branches={branches}
                  onSelect={chooseBranch}
                  selectedBranchId={selectedBranchId}
                />
              ) : null}
            </div>
            <Button className="hidden gap-2 xl:inline-flex" variant="ghost">
              <CalendarDays className="size-[var(--icon-sm)]" />
              {today}
            </Button>
            <div className="relative">
              <button
                aria-label="Notifications"
                className="relative grid size-10 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]"
                onClick={() => setIsNotificationsOpen((value) => !value)}
                type="button"
              >
                <Bell className="size-[var(--icon-sm)]" />
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-[var(--color-text-inverse)]">
                  {fallbackNotifications.length}
                </span>
              </button>
              {isNotificationsOpen ? (
                <NotificationsMenu
                  onSelect={(href) => {
                    setIsNotificationsOpen(false);
                    router.push(href);
                  }}
                />
              ) : null}
            </div>
            <button
              className="hidden items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-2 py-1 text-left hover:bg-[var(--color-surface-muted)] md:flex"
              onClick={() => setIsUserMenuOpen((value) => !value)}
              type="button"
            >
              <div className="grid size-10 place-items-center rounded-[var(--radius-full)] bg-[var(--color-primary)] text-sm font-bold text-[var(--color-text-inverse)]">
                {initials(shellUser?.name || "User")}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {shellUser?.name || "Evolve User"}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {formatRole(shellUser?.role)}
                </p>
              </div>
              <ChevronDown className="size-[var(--icon-sm)] text-[var(--color-text-muted)]" />
            </button>
            <div className="relative hidden md:block">
              {isUserMenuOpen ? (
                <UserMenu user={shellUser} onLogout={logout} />
              ) : null}
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

function BranchMenu({
  branches,
  onSelect,
  selectedBranchId,
}: {
  branches: Branch[];
  onSelect: (branchId: string) => void;
  selectedBranchId: string | null;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[var(--z-dropdown)] w-64 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
      <div className="border-b border-[var(--color-divider)] px-3 py-2 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
        Branch
      </div>
      {branches.length ? branches.map((branch) => (
        <button
          className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-[var(--color-surface-hover)]"
          key={branch.id}
          onClick={() => onSelect(branch.id)}
          type="button"
        >
          <MapPin className="mt-0.5 size-[var(--icon-sm)] text-[var(--color-primary)]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[var(--color-text)]">
              {branch.name}
            </span>
            <span className="block truncate text-xs text-[var(--color-text-secondary)]">
              {branch.address || "No address added"}
            </span>
          </span>
          {branch.id === selectedBranchId ? (
            <Check className="size-[var(--icon-sm)] text-[var(--color-success)]" />
          ) : null}
        </button>
      )) : (
        <p className="px-3 py-3 text-sm text-[var(--color-text-secondary)]">No branches available.</p>
      )}
    </div>
  );
}

function SearchResults({
  items,
  onSelect,
  query,
}: {
  items: SearchItem[];
  onSelect: (href: string) => void;
  query: string;
}) {
  return (
    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[var(--z-dropdown)] w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
      {items.length ? (
        items.map((item) => (
          <button
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-hover)]"
            key={`${item.type}-${item.label}-${item.meta}`}
            onClick={() => onSelect(item.href)}
            type="button"
          >
            <SearchIcon type={item.type} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[var(--color-text)]">
                {item.label}
              </span>
              <span className="block truncate text-xs text-[var(--color-text-secondary)]">
                {item.type} - {item.meta}
              </span>
            </span>
          </button>
        ))
      ) : (
        <div className="px-4 py-6 text-sm text-[var(--color-text-secondary)]">
          No results found for &quot;{query}&quot;.
        </div>
      )}
    </div>
  );
}

function SearchIcon({ type }: { type: SearchItem["type"] }) {
  const Icon =
    type === "Member"
      ? UsersRound
      : type === "Lead"
        ? UserRound
        : type === "Plan"
          ? WalletCards
          : UsersRound;

  return (
    <span className="grid size-9 place-items-center rounded-[var(--radius-full)] bg-[var(--blue-100)] text-[var(--color-primary)]">
      <Icon className="size-[var(--icon-sm)]" />
    </span>
  );
}

function NotificationsMenu({
  onSelect,
}: {
  onSelect: (href: string) => void;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[var(--z-dropdown)] w-80 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
      <div className="flex items-center justify-between border-b border-[var(--color-divider)] px-4 py-3">
        <p className="text-sm font-bold text-[var(--color-text)]">
          Notifications
        </p>
        <span className="rounded-full bg-[var(--red-100)] px-2 py-0.5 text-xs font-bold text-[var(--color-danger)]">
          {fallbackNotifications.length}
        </span>
      </div>
      {fallbackNotifications.map((notification) => {
        const Icon = notification.icon;
        return (
          <button
            className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-hover)]"
            key={notification.title}
            onClick={() => onSelect(notification.href)}
            type="button"
          >
            <span className="grid size-9 place-items-center rounded-[var(--radius-full)] bg-[var(--blue-100)] text-[var(--color-primary)]">
              <Icon className="size-[var(--icon-sm)]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--color-text)]">
                {notification.title}
              </span>
              <span className="block text-xs text-[var(--color-text-secondary)]">
                {notification.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function UserMenu({
  onLogout,
  user,
}: {
  onLogout: () => void;
  user: AuthUser | null;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[var(--z-dropdown)] w-72 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
      <div className="border-b border-[var(--color-divider)] px-4 py-3">
        <p className="truncate text-sm font-bold text-[var(--color-text)]">
          {user?.name || "Evolve User"}
        </p>
        <p className="truncate text-xs text-[var(--color-text-secondary)]">
          {user?.email || "Signed in user"}
        </p>
      </div>
      <Link
        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
        href="/settings"
      >
        <Settings className="size-[var(--icon-sm)]" />
        Account settings
      </Link>
      <Link
        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
        href="/inbox"
      >
        <MessageSquare className="size-[var(--icon-sm)]" />
        Inbox
      </Link>
      <button
        className="flex w-full items-center gap-3 border-t border-[var(--color-divider)] px-4 py-3 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--red-50)]"
        onClick={onLogout}
        type="button"
      >
        <LogOut className="size-[var(--icon-sm)]" />
        Sign out
      </button>
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
