"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  Dumbbell,
  FileClock,
  RefreshCw,
  Snowflake,
  UserCheck,
  UserMinus,
  UserPlus,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AuthUser } from "@/lib/api/auth";
import {
  type DashboardSnapshot,
  getDashboardSnapshot,
} from "@/lib/api/dashboard";
import { getAccessToken, getStoredUser } from "@/lib/session";

const trialRows = [
  ["Trials Scheduled", "trialsScheduled"],
  ["Trials Today", "trialsToday"],
  ["Awaiting Decision", "awaitingDecision"],
  ["Converted to Member", "convertedToMember"],
  ["Lost After Trial", "lostAfterTrial"],
] as const;

const activities = [
  ["10:30 AM", "Rahul Sharma marked present", "Attendance", "active"],
  ["10:15 AM", "Neha Joshi follow-up completed", "Lead", "trial"],
  ["09:45 AM", "Payment of ₹3,650 received", "Payment", "active"],
  ["09:20 AM", "Trial scheduled for Pooja Agarwal", "Trial", "pending"],
  ["08:50 AM", "New lead from Website", "Lead", "trial"],
] as const;

const reminders = [
  ["24", "AUG", "3 Membership Renewals", "Tomorrow"],
  ["25", "AUG", "2 Trial Follow-ups", "In 2 days"],
  ["27", "AUG", "1 Expiring Membership", "In 4 days"],
  ["30", "AUG", "Staff Appraisal Due", "In 7 days"],
] as const;

export function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const storedUser = getStoredUser();

    if (!token) {
      router.replace("/");
      return;
    }

    getDashboardSnapshot(token)
      .then((data) => {
        setUser(storedUser);
        setSnapshot(data);
      })
      .catch((apiError) => {
        setError(
          apiError instanceof Error
            ? apiError.message
            : "Unable to load dashboard.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const stats = useMemo(() => {
    const memberSummary = snapshot?.memberSummary;
    return [
      {
        title: "Total Clients",
        value: memberSummary?.totalClients ?? "—",
        note: "All registered clients",
        tone: "blue",
        icon: UsersRound,
      },
      {
        title: "Active Clients",
        value: memberSummary?.activeClients ?? "—",
        note: "Currently active",
        tone: "green",
        icon: UserCheck,
      },
      {
        title: "Inactive Clients",
        value: memberSummary?.inactiveClients ?? "—",
        note: "Needs attention",
        tone: "violet",
        icon: UserMinus,
      },
      {
        title: "New Clients This Month",
        value: memberSummary?.newClientsThisMonth ?? "—",
        note: "Created this month",
        tone: "blue",
        icon: UserPlus,
      },
      {
        title: "Membership Renewed",
        value: memberSummary?.activeClients ?? "—",
        note: "Active membership base",
        tone: "cyan",
        icon: RefreshCw,
      },
      {
        title: "Pending Activation",
        value: memberSummary?.pendingActivation ?? "—",
        note: "Awaiting activation",
        tone: "amber",
        icon: CalendarClock,
      },
      {
        title: "Frozen",
        value: memberSummary?.frozen ?? "—",
        note: "Paused memberships",
        tone: "blue",
        icon: Snowflake,
      },
      {
        title: "Expiring Soon",
        value: memberSummary?.membershipExpiringSoon ?? "—",
        note: "Renewal opportunity",
        tone: "amber",
        icon: AlertTriangle,
      },
      {
        title: "Lost",
        value: memberSummary?.expired ?? "—",
        note: "Lost or declined",
        tone: "red",
        icon: UserMinus,
      },
      {
        title: "Today's Client Attendance",
        value: "—",
        note: "Attendance module coming next",
        tone: "blue",
        icon: Activity,
        wide: true,
      },
      {
        title: "Today's Staff Attendance",
        value: "—",
        note: "Staff attendance module coming next",
        tone: "green",
        icon: UserCheck,
        wide: true,
      },
    ] as const;
  }, [snapshot]);

  return (
    <AppShell user={user}>
      <div className="grid gap-[var(--section-gap)]">
        <div className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-[var(--tracking-tight)] text-[var(--color-text)]">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Today&apos;s snapshot across enquiries, trials and members.
            </p>
          </div>
          <div className="flex flex-col gap-[var(--space-3)] sm:flex-row">
            <Button className="gap-2" variant="secondary">
              <WalletCards className="size-[var(--icon-sm)]" />
              Session & Price Calculator
            </Button>
            <Button className="gap-2">
              <UserPlus className="size-[var(--icon-sm)]" />
              New Lead
            </Button>
          </div>
        </div>

        {error ? (
          <Card className="border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-[var(--space-4)] text-sm font-medium text-[var(--color-danger)]">
            {error}
          </Card>
        ) : null}

        <div className="grid gap-[var(--section-gap)] xl:grid-cols-[1fr_18rem]">
          <section className="grid gap-[var(--grid-gap)] sm:grid-cols-2 2xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </section>

          <aside className="grid gap-[var(--grid-gap)] content-start">
            <SideSummaryCard
              icon={CreditCard}
              title="Payment Dues"
              rows={[
                ["Total Payment Due", formatCurrency(snapshot?.paymentDues.totalPaymentDue)],
                ["Due Today", formatCurrency(snapshot?.paymentDues.dueToday)],
                ["Overdue", formatCurrency(snapshot?.paymentDues.overdue)],
              ]}
              action="View Payment Dues"
            />
            <SideSummaryCard
              icon={Dumbbell}
              title="Personal Training"
              rows={[
                ["Active PT", "2"],
                ["Inactive PT", "2"],
              ]}
              action="View Staff"
            />
          </aside>
        </div>

        <section className="grid gap-[var(--section-gap)] xl:grid-cols-[0.9fr_1fr_0.95fr]">
          <Card className="overflow-hidden">
            <PanelHeader icon={FileClock} title="Trial Summary" />
            <div>
              {trialRows.map(([label, key]) => (
                <SummaryRow
                  key={key}
                  label={label}
                  value={snapshot?.trialSummary[key] ?? (isLoading ? "—" : 0)}
                />
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <PanelHeader icon={Activity} meta="Filter: All" title="Today's Activity" />
            <div className="px-[var(--space-4)] pb-[var(--space-4)]">
              {activities.map(([time, label, badge, status]) => (
                <div
                  className="grid grid-cols-[5rem_1fr_auto] items-center gap-[var(--space-3)] border-l border-[var(--color-border)] py-[var(--space-3)] pl-[var(--space-4)] text-sm"
                  key={`${time}-${label}`}
                >
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">
                    {time}
                  </span>
                  <span className="min-w-0 truncate text-[var(--color-text)]">
                    {label}
                  </span>
                  <StatusBadge status={status}>{badge}</StatusBadge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <PanelHeader icon={CalendarCheck} title="Upcoming Reminders" />
            <div className="divide-y divide-[var(--color-divider)] px-[var(--space-4)]">
              {reminders.map(([day, month, title, due]) => (
                <div
                  className="grid grid-cols-[3rem_1fr_auto] items-center gap-[var(--space-3)] py-[var(--space-4)]"
                  key={`${day}-${title}`}
                >
                  <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2 py-1 text-center">
                    <p className="text-sm font-bold leading-tight">{day}</p>
                    <p className="text-[10px] font-bold text-[var(--color-primary)]">
                      {month}
                    </p>
                  </div>
                  <p className="min-w-0 truncate text-sm font-medium text-[var(--color-text)]">
                    {title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{due}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function SideSummaryCard({
  icon: Icon,
  title,
  rows,
  action,
}: {
  icon: typeof CreditCard;
  title: string;
  rows: Array<[string, string]>;
  action: string;
}) {
  return (
    <Card className="p-[var(--space-4)]">
      <div className="mb-[var(--space-4)] flex items-center gap-[var(--space-3)]">
        <div className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
          <Icon className="size-[var(--icon-sm)]" />
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="divide-y divide-[var(--color-divider)]">
        {rows.map(([label, value]) => (
          <div className="flex items-center justify-between py-[var(--space-3)]" key={label}>
            <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
            <p className="text-sm font-bold text-[var(--color-danger)]">{value}</p>
          </div>
        ))}
      </div>
      <Button className="mt-[var(--space-3)] w-full" variant="secondary">
        {action}
      </Button>
    </Card>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  meta,
}: {
  icon: typeof Activity;
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-[var(--color-divider)] px-[var(--space-4)]">
      <div className="flex items-center gap-[var(--space-3)]">
        <div className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
          <Icon className="size-[var(--icon-sm)]" />
        </div>
        <h2 className="text-base font-bold text-[var(--color-text)]">{title}</h2>
      </div>
      {meta ? (
        <p className="text-xs font-medium text-[var(--color-text-muted)]">{meta}</p>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-h-12 items-center justify-between border-b border-[var(--color-divider)] px-[var(--space-4)] last:border-b-0">
      <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
      <p className="text-base font-bold text-[var(--color-primary)]">{value}</p>
    </div>
  );
}

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(value);
}
