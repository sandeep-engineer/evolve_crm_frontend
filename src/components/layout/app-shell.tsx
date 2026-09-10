"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
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
  RefreshCw,
  Search,
  Settings,
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
import { getMembers } from "@/lib/api/members";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationApiError,
  type NotificationItem,
} from "@/lib/api/notifications";
import { getPlans } from "@/lib/api/plans";
import { getStaff, staffQueryForUser } from "@/lib/api/staff";
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
  {
    label: "Leads",
    href: "/leads",
    icon: UserRound,
    countKey: "leads",
    roles: ["CRM_OWNER", "ORGANIZATION_OWNER", "BRANCH_ADMIN", "RECEPTIONIST"],
  },
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
  type: "Member" | "Plan" | "Staff";
};

const BRANCH_KEY = "fitcrm.selectedBranchId";
const NOTIFICATION_PAGE_SIZE = 10;
const NOTIFICATION_POLL_INTERVAL_MS = 60_000;
const NOTIFICATION_ROLES: Array<AuthUser["role"]> = [
  "CRM_OWNER",
  "ORGANIZATION_OWNER",
  "BRANCH_ADMIN",
  "RECEPTIONIST",
];

export function AppShell({ children, user }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [shellUser, setShellUser] = useState<AuthUser | null>(user);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<NavigationCountKey, number>>({
    inbox: 7,
    leads: 0,
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
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationTotalPages, setNotificationTotalPages] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [isMoreNotificationsLoading, setIsMoreNotificationsLoading] = useState(false);
  const [isUnreadCountLoading, setIsUnreadCountLoading] = useState(false);
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
  const [isMarkingAllNotifications, setIsMarkingAllNotifications] = useState(false);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationCountRequestRef = useRef(false);
  const notificationListRequestRef = useRef(false);
  const today = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  }).format(new Date());
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);
  const canUseNotifications = shellUser ? NOTIFICATION_ROLES.includes(shellUser.role) : false;
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

        const staffQuery = staffQueryForUser(currentUser);
        const [branchResult, memberResult, planResult, staffResult] =
          await Promise.allSettled([
            currentUser.role === "CRM_OWNER"
              ? Promise.resolve<Branch[]>([])
              : getBranches(accessToken),
            getMembers(accessToken),
            getPlans(accessToken),
            staffQuery ? getStaff(accessToken, staffQuery) : Promise.resolve(null),
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
        const plans = planResult.status === "fulfilled" ? planResult.value : [];
        const staff = staffResult.status === "fulfilled" ? staffResult.value?.data ?? [] : [];

        setCounts({
          inbox: 7,
          leads: 0,
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

  const handleNotificationAuthLoss = useCallback(() => {
    clearSession();
    setShellUser(null);
    setNotificationItems([]);
    setUnreadNotificationCount(0);
    setIsNotificationsOpen(false);
    router.replace("/");
  }, [router]);

  const loadUnreadCount = useCallback(async (background = false) => {
    const token = getAccessToken();
    if (!token || !canUseNotifications || notificationCountRequestRef.current) return;
    notificationCountRequestRef.current = true;
    if (!background) setIsUnreadCountLoading(true);
    try {
      const result = await getUnreadNotificationCount(token);
      setUnreadNotificationCount(result.unreadCount);
    } catch (apiError) {
      if (apiError instanceof NotificationApiError && apiError.status === 401) {
        handleNotificationAuthLoss();
      }
    } finally {
      notificationCountRequestRef.current = false;
      if (!background) setIsUnreadCountLoading(false);
    }
  }, [canUseNotifications, handleNotificationAuthLoss]);

  const loadNotificationsPage = useCallback(async (page: number, mode: "replace" | "append") => {
    const token = getAccessToken();
    if (!token || !canUseNotifications || notificationListRequestRef.current) return;
    notificationListRequestRef.current = true;
    setNotificationError(null);
    if (mode === "replace") {
      setIsNotificationsLoading(true);
    } else {
      setIsMoreNotificationsLoading(true);
    }
    try {
      const result = await listNotifications(token, {
        page,
        limit: NOTIFICATION_PAGE_SIZE,
      });
      setNotificationPage(result.meta.page);
      setNotificationTotalPages(result.meta.totalPages);
      setNotificationItems((current) => {
        if (mode === "replace") return result.data;
        const seen = new Set(current.map((notification) => notification.id));
        return [
          ...current,
          ...result.data.filter((notification) => !seen.has(notification.id)),
        ];
      });
    } catch (apiError) {
      if (apiError instanceof NotificationApiError && apiError.status === 401) {
        handleNotificationAuthLoss();
        return;
      }
      setNotificationError(apiError instanceof Error ? apiError.message : "Unable to load notifications.");
    } finally {
      notificationListRequestRef.current = false;
      setIsNotificationsLoading(false);
      setIsMoreNotificationsLoading(false);
    }
  }, [canUseNotifications, handleNotificationAuthLoss]);

  const refreshNotifications = useCallback(() => {
    void loadUnreadCount(false);
    void loadNotificationsPage(1, "replace");
  }, [loadNotificationsPage, loadUnreadCount]);

  useEffect(() => {
    if (!canUseNotifications) return;

    const initialRequestId = window.setTimeout(() => {
      void loadUnreadCount(true);
    }, 0);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadUnreadCount(true);
    }, NOTIFICATION_POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void loadUnreadCount(true);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearTimeout(initialRequestId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [canUseNotifications, loadUnreadCount]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (notificationPanelRef.current?.contains(target)) return;
      if (notificationButtonRef.current?.contains(target)) return;
      setIsNotificationsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
        notificationButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationsOpen]);

  async function markOneNotificationRead(notification: NotificationItem) {
    if (notification.readAt || markingNotificationId) return;
    const token = getAccessToken();
    if (!token) {
      handleNotificationAuthLoss();
      return;
    }
    setMarkingNotificationId(notification.id);
    setNotificationError(null);
    try {
      const updatedNotification = await markNotificationRead(token, notification.id);
      setNotificationItems((current) =>
        current.map((item) => item.id === updatedNotification.id ? updatedNotification : item),
      );
      await Promise.all([loadUnreadCount(false), loadNotificationsPage(1, "replace")]);
    } catch (apiError) {
      if (apiError instanceof NotificationApiError && apiError.status === 401) {
        handleNotificationAuthLoss();
        return;
      }
      setNotificationError(apiError instanceof Error ? apiError.message : "Unable to mark notification as read.");
    } finally {
      setMarkingNotificationId(null);
    }
  }

  async function markEveryNotificationRead() {
    if (isMarkingAllNotifications || unreadNotificationCount <= 0) return;
    const token = getAccessToken();
    if (!token) {
      handleNotificationAuthLoss();
      return;
    }
    setIsMarkingAllNotifications(true);
    setNotificationError(null);
    try {
      await markAllNotificationsRead(token);
      const readAt = new Date().toISOString();
      setNotificationItems((current) =>
        current.map((notification) =>
          notification.readAt ? notification : { ...notification, readAt },
        ),
      );
      await Promise.all([loadUnreadCount(false), loadNotificationsPage(1, "replace")]);
    } catch (apiError) {
      if (apiError instanceof NotificationApiError && apiError.status === 401) {
        handleNotificationAuthLoss();
        return;
      }
      setNotificationError(apiError instanceof Error ? apiError.message : "Unable to mark notifications as read.");
    } finally {
      setIsMarkingAllNotifications(false);
    }
  }

  function toggleNotifications() {
    if (!canUseNotifications) return;
    const nextOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpen);
    if (nextOpen) refreshNotifications();
  }

  function logout() {
    clearSession();
    setShellUser(null);
    setNotificationItems([]);
    setUnreadNotificationCount(0);
    setIsNotificationsOpen(false);
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
              placeholder="Search members, plans, staff..."
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
              {canUseNotifications ? (
                <>
                  <button
                    ref={notificationButtonRef}
                    aria-expanded={isNotificationsOpen}
                    aria-label={`Notifications, ${unreadNotificationCount} unread`}
                    className="relative grid size-10 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-surface-hover)]"
                    onClick={toggleNotifications}
                    type="button"
                  >
                    {isUnreadCountLoading ? (
                      <Loader2 className="size-[var(--icon-sm)] animate-spin" />
                    ) : (
                      <Bell className="size-[var(--icon-sm)]" />
                    )}
                    {unreadNotificationCount > 0 ? (
                      <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold leading-none text-[var(--color-text-inverse)]">
                        {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                      </span>
                    ) : null}
                  </button>
                  {isNotificationsOpen ? (
                    <NotificationsMenu
                      ref={notificationPanelRef}
                      error={notificationError}
                      hasMore={notificationPage < notificationTotalPages}
                      isLoading={isNotificationsLoading}
                      isLoadingMore={isMoreNotificationsLoading}
                      isMarkingAll={isMarkingAllNotifications}
                      markingNotificationId={markingNotificationId}
                      notifications={notificationItems}
                      onLoadMore={() => void loadNotificationsPage(notificationPage + 1, "append")}
                      onMarkAllRead={() => void markEveryNotificationRead()}
                      onMarkRead={(notification) => void markOneNotificationRead(notification)}
                      onRetry={refreshNotifications}
                      unreadCount={unreadNotificationCount}
                    />
                  ) : null}
                </>
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
      : type === "Plan"
          ? WalletCards
          : UsersRound;

  return (
    <span className="grid size-9 place-items-center rounded-[var(--radius-full)] bg-[var(--blue-100)] text-[var(--color-primary)]">
      <Icon className="size-[var(--icon-sm)]" />
    </span>
  );
}

const NotificationsMenu = forwardRef<HTMLDivElement, {
  error: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isMarkingAll: boolean;
  markingNotificationId: string | null;
  notifications: NotificationItem[];
  onLoadMore: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (notification: NotificationItem) => void;
  onRetry: () => void;
  unreadCount: number;
}>(function NotificationsMenu({
  error,
  hasMore,
  isLoading,
  isLoadingMore,
  isMarkingAll,
  markingNotificationId,
  notifications,
  onLoadMore,
  onMarkAllRead,
  onMarkRead,
  onRetry,
  unreadCount,
}, ref) {
  return (
    <div
      ref={ref}
      aria-label="Notifications"
      className="absolute right-0 top-[calc(100%+0.5rem)] z-[var(--z-dropdown)] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
      role="region"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-divider)] px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--color-text)]">
            Notifications
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            className="inline-flex h-8 items-center gap-2 rounded-[var(--radius-md)] px-2 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]"
            disabled={isMarkingAll}
            onClick={onMarkAllRead}
            type="button"
          >
            {isMarkingAll ? <Loader2 className="size-3 animate-spin" /> : <CheckCheck className="size-3" />}
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="max-h-[min(32rem,calc(100dvh-7rem))] overflow-y-auto">
        {error ? (
          <div className="grid gap-3 px-4 py-6 text-sm">
            <p className="font-medium text-[var(--color-danger)]" role="alert">
              {error}
            </p>
            <Button className="w-fit gap-2" onClick={onRetry} variant="secondary">
              <RefreshCw className="size-[var(--icon-sm)]" />
              Retry
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-[var(--color-text-secondary)]">
            <Loader2 className="size-[var(--icon-sm)] animate-spin" />
            Loading notifications...
          </div>
        ) : null}

        {!isLoading && !error && notifications.length === 0 ? (
          <div className="px-4 py-8 text-sm text-[var(--color-text-secondary)]">
            No notifications
          </div>
        ) : null}

        {!isLoading && !error && notifications.length > 0 ? (
          <div className="divide-y divide-[var(--color-divider)]">
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                isMarking={markingNotificationId === notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && hasMore ? (
          <div className="border-t border-[var(--color-divider)] px-4 py-3">
            <Button
              className="w-full gap-2"
              disabled={isLoadingMore}
              onClick={onLoadMore}
              variant="secondary"
            >
              {isLoadingMore ? <Loader2 className="size-[var(--icon-sm)] animate-spin" /> : null}
              Load more
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
});

function NotificationRow({
  isMarking,
  notification,
  onMarkRead,
}: {
  isMarking: boolean;
  notification: NotificationItem;
  onMarkRead: (notification: NotificationItem) => void;
}) {
  const isUnread = notification.readAt === null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 text-left">
      <span className={cn(
        "mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius-full)]",
        isUnread
          ? "bg-[var(--blue-100)] text-[var(--color-primary)]"
          : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
      )}>
        <CalendarDays className="size-[var(--icon-sm)]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {notificationTitle(notification)}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">
              {notificationDescription(notification)}
            </p>
          </div>
          {isUnread ? (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--color-danger)]" aria-label="Unread notification" />
          ) : null}
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Scheduled {formatDateTime(notification.scheduledFor)}
        </p>
        {isUnread ? (
          <button
            className="mt-2 inline-flex h-8 items-center gap-2 rounded-[var(--radius-md)] px-2 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]"
            disabled={isMarking}
            onClick={() => onMarkRead(notification)}
            type="button"
          >
            {isMarking ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            Mark read
          </button>
        ) : (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Read {formatDateTime(notification.readAt)}
          </p>
        )}
      </div>
    </div>
  );
}

function notificationTitle(notification: NotificationItem) {
  const leadName = notification.lead?.fullName || "Lead follow-up";
  return notification.type === "LEAD_FOLLOW_UP_MORNING"
    ? `Morning follow-up reminder for ${leadName}`
    : `Follow-up due for ${leadName}`;
}

function notificationDescription(notification: NotificationItem) {
  const channel = notification.followUp?.channel
    ? formatRole(notification.followUp.channel)
    : "Follow-up";
  const status = notification.followUp?.status
    ? formatRole(notification.followUp.status)
    : "scheduled";
  const followUpTime = notification.followUp?.scheduledAt
    ? formatDateTime(notification.followUp.scheduledAt)
    : formatDateTime(notification.scheduledFor);
  return `${channel} ${status.toLowerCase()} for ${followUpTime}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown time";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
