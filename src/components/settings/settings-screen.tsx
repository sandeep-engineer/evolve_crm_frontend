"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  BadgeInfo,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  Info,
  Lock,
  LockKeyhole,
  MapPin,
  MoreVertical,
  Music,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Tag,
  Target,
  TrendingDown,
  UserRound,
  UserRoundCog,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BranchManagement } from "@/components/branches/branch-management";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/filter-select";
import { InitialAvatar } from "@/components/ui/initial-avatar";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AuthUser } from "@/lib/api/auth";
import { getStoredUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type SettingsSection = "branches" | "programs" | "goals" | "tags" | "account";

const sections = [
  { id: "branches", label: "Branches", group: "ORGANIZATION", icon: MapPin },
  { id: "programs", label: "Programs", group: "ORGANIZATION", count: 5, icon: Dumbbell },
  { id: "goals", label: "Goals", group: "MEMBER CONFIGURATION", count: 5, icon: Target },
  { id: "tags", label: "Tags", group: "MEMBER CONFIGURATION", count: 5, icon: Tag },
  { id: "account", label: "Account & Security", group: "PERSONAL", icon: UserRoundCog },
] as const;

const programs = [
  { name: "Calisthenics", description: "Bodyweight strength and conditioning", branches: "3 branches", plans: 8, batches: 6, members: 5, icon: Dumbbell, tone: "blue" },
  { name: "MMA", description: "Mixed martial arts training", branches: "2 branches", plans: 6, batches: 4, members: 3, icon: Target, tone: "red" },
  { name: "Zumba", description: "Dance-based cardio fitness", branches: "2 branches", plans: 4, batches: 2, members: 2, icon: Music, tone: "purple" },
  { name: "Yoga", description: "Mobility, balance and wellness", branches: "3 branches", plans: 5, batches: 3, members: 1, icon: HeartPulse, tone: "green" },
  { name: "Personal Training", description: "One-to-one coached sessions", branches: "3 branches", plans: 3, batches: "-", members: 2, icon: UserRound, tone: "orange" },
];

const goals = [
  { name: "Weight Loss", description: "Reduce body fat and improve overall fitness", members: 3, leads: 5, usage: 8, updated: "20 Aug 2026", icon: TrendingDown, tone: "red" },
  { name: "Muscle Gain", description: "Build strength and increase lean muscle", members: 3, leads: 4, usage: 7, updated: "18 Aug 2026", icon: Dumbbell, tone: "blue" },
  { name: "General Fitness", description: "Maintain health, energy and daily activity", members: 2, leads: 4, usage: 6, updated: "12 Aug 2026", icon: HeartPulse, tone: "green" },
  { name: "Endurance", description: "Improve cardiovascular stamina and conditioning", members: 2, leads: 3, usage: 5, updated: "08 Aug 2026", icon: Zap, tone: "purple" },
  { name: "Flexibility & Mobility", description: "Improve movement quality, balance and mobility", members: 1, leads: 2, usage: 3, updated: "02 Aug 2026", icon: UserRound, tone: "orange" },
];

const tags = [
  { name: "VIP", description: "High-value or priority customer", appliesTo: "Members & Leads", members: "2", leads: "1", usage: 3, updated: "21 Aug 2026", icon: Zap, tone: "purple" },
  { name: "High Intent", description: "Lead showing strong conversion interest", appliesTo: "Leads", members: "-", leads: "5", usage: 5, updated: "19 Aug 2026", icon: TrendingDown, tone: "blue" },
  { name: "Follow-up Required", description: "Profile requiring a scheduled follow-up", appliesTo: "Members & Leads", members: "3", leads: "4", usage: 7, updated: "16 Aug 2026", icon: BadgeInfo, tone: "orange" },
  { name: "Personal Training", description: "Interested in or enrolled for personal training", appliesTo: "Members & Leads", members: "2", leads: "2", usage: 4, updated: "10 Aug 2026", icon: UserRound, tone: "green" },
  { name: "Referral", description: "Profile acquired through a referral", appliesTo: "Members & Leads", members: "1", leads: "6", usage: 7, updated: "04 Aug 2026", icon: UsersRound, tone: "teal" },
];

export function SettingsScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>("branches");

  useEffect(() => {
    const timer = window.setTimeout(() => setUser(getStoredUser()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AppShell user={user}>
      <div className="grid gap-[var(--space-6)] xl:grid-cols-[18rem_1fr]">
        <SettingsNav activeSection={activeSection} onChange={setActiveSection} />
        <div className="min-w-0">
          {activeSection === "branches" ? <BranchManagement /> : null}
          {activeSection === "programs" ? <ProgramsSection /> : null}
          {activeSection === "goals" ? <GoalsSection /> : null}
          {activeSection === "tags" ? <TagsSection /> : null}
          {activeSection === "account" ? <AccountSection user={user} /> : null}
        </div>
      </div>
    </AppShell>
  );
}

function SettingsNav({
  activeSection,
  onChange,
}: {
  activeSection: SettingsSection;
  onChange: (section: SettingsSection) => void;
}) {
  return (
    <Card className="h-fit p-[var(--space-4)]">
      <h2 className="text-lg font-bold text-[var(--color-text)]">Settings</h2>
      <div className="mt-[var(--space-4)] border-t border-[var(--color-divider)] pt-[var(--space-3)]">
        {sections.map((item, index) => {
          const showGroup = index === 0 || sections[index - 1].group !== item.group;
          const Icon = item.icon;
          const active = item.id === activeSection;

          return (
            <div key={item.id}>
              {showGroup ? (
                <p className="mt-[var(--space-3)] px-2 text-xs font-semibold uppercase text-[var(--color-text-muted)] first:mt-0">
                  {item.group}
                </p>
              ) : null}
              <button
                className={cn(
                  "mt-1 flex h-11 w-full items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]",
                  active && "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
                )}
                onClick={() => onChange(item.id)}
                type="button"
              >
                <Icon className="size-[var(--icon-sm)]" />
                <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                {"count" in item && item.count ? (
                  <span className="rounded-full bg-[var(--gray-100)] px-2 py-0.5 text-xs font-bold text-[var(--color-text-secondary)]">
                    {item.count}
                  </span>
                ) : null}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ProgramsSection() {
  return (
    <SettingsSectionFrame actionLabel="Add Program" description="Manage fitness programs available across branches." title="Programs">
      <InfoBanner icon={Info} text="Programs are used by plans, batches, leads and member profiles." />
      <SettingsDataTable count="5 programs" searchPlaceholder="Search programs by name" sortValue="Name">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <TableHead columns={["Program", "Description", "Available at", "Plans", "Batches", "Members", "Status", "Actions"]} />
          <tbody>
            {programs.map((program) => {
              const Icon = program.icon;
              return (
                <tr className="border-b border-[var(--color-divider)] last:border-0" key={program.name}>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]">
                    <div className="flex items-center gap-[var(--space-3)]">
                      <ToneIcon icon={Icon} tone={program.tone} />
                      <span className="font-bold text-[var(--color-text)]">{program.name}</span>
                    </div>
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{program.description}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{program.branches}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] font-bold">{program.plans}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] font-bold">{program.batches}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] font-bold">{program.members}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]"><SettingStatus active /></td>
                  <RowActions />
                </tr>
              );
            })}
          </tbody>
        </table>
      </SettingsDataTable>
      <Card className="p-[var(--card-padding)]">
        <div className="flex flex-wrap items-start justify-between gap-[var(--space-4)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Program availability</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Control which programs can be offered at each branch.</p>
          </div>
          <Button variant="secondary">Manage availability</Button>
        </div>
        <div className="mt-[var(--space-5)] grid gap-[var(--space-5)] md:grid-cols-3">
          <AvailabilityColumn branch="Andheri West" items={["Calisthenics", "MMA", "Zumba", "Yoga", "Personal Training"]} />
          <AvailabilityColumn branch="Bandra West" items={["Calisthenics", "Zumba", "Yoga", "Personal Training"]} />
          <AvailabilityColumn branch="Powai" items={["Calisthenics", "MMA"]} />
        </div>
      </Card>
    </SettingsSectionFrame>
  );
}

function GoalsSection() {
  return (
    <SettingsSectionFrame actionLabel="Add Goal" description="Manage fitness goals used in lead and member profiles." title="Goals">
      <InfoBanner icon={Target} text="Goals help classify member objectives and personalize follow-ups." />
      <SettingsDataTable count="5 goals" searchPlaceholder="Search goals by name" sortValue="Name">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <TableHead columns={["Goal", "Description", "Members", "Leads", "Total usage", "Status", "Last updated", "Actions"]} />
          <tbody>
            {goals.map((goal) => {
              const Icon = goal.icon;
              return (
                <tr className="border-b border-[var(--color-divider)] last:border-0" key={goal.name}>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]">
                    <div className="flex items-center gap-[var(--space-3)]">
                      <ToneIcon icon={Icon} tone={goal.tone} />
                      <span className="font-bold text-[var(--color-text)]">{goal.name}</span>
                    </div>
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{goal.description}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] font-bold">{goal.members}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] font-bold">{goal.leads}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]"><UsageBar value={goal.usage} /></td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]"><SettingStatus active /></td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{goal.updated}</td>
                  <RowActions />
                </tr>
              );
            })}
          </tbody>
        </table>
      </SettingsDataTable>
      <UsageSummary title="Goal usage summary" description="Current assignments across profiles." firstLabel="Member profiles" firstValue="11" secondLabel="Lead profiles" secondValue="18" note="Deactivating a goal keeps it visible on existing profiles but prevents new assignments." />
    </SettingsSectionFrame>
  );
}

function TagsSection() {
  return (
    <SettingsSectionFrame actionLabel="Add Tag" description="Manage reusable labels for members and leads." title="Tags">
      <InfoBanner icon={Tag} text="Tags make profiles easier to organize, filter and follow up." />
      <SettingsDataTable count="5 tags" searchPlaceholder="Search tags by name" sortValue="Name">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <TableHead columns={["Tag", "Description", "Applies to", "Members", "Leads", "Total usage", "Status", "Last updated", "Actions"]} />
          <tbody>
            {tags.map((tag) => {
              const Icon = tag.icon;
              return (
                <tr className="border-b border-[var(--color-divider)] last:border-0" key={tag.name}>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]">
                    <TagChip tone={tag.tone}>
                      <Icon className="size-[var(--icon-sm)]" />
                      {tag.name}
                    </TagChip>
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{tag.description}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{tag.appliesTo}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] font-bold">{tag.members}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] font-bold">{tag.leads}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]"><UsageBar value={tag.usage} /></td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]"><SettingStatus active /></td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{tag.updated}</td>
                  <RowActions />
                </tr>
              );
            })}
          </tbody>
        </table>
      </SettingsDataTable>
      <UsageSummary title="Tag usage summary" description="Current tag assignments across profiles." firstLabel="Member tag assignments" firstValue="8" secondLabel="Lead tag assignments" secondValue="18" note="Deactivating a tag keeps existing assignments but removes it from new profile selections." />
    </SettingsSectionFrame>
  );
}

function AccountSection({ user }: { user: AuthUser | null }) {
  return (
    <SettingsContentHeader description="View your profile, access context and current sign-in." title="Account & Security">
      <InfoBanner icon={Shield} text="Profile and access changes are managed by your administrator." />
      <Card className="p-[var(--card-padding)]">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Profile</h2>
        <div className="mt-[var(--space-4)] flex items-center gap-[var(--space-4)]">
          <InitialAvatar className="size-14 text-lg" name={user?.name || "Anjali Verma"} />
          <div className="min-w-0">
            <p className="text-base font-bold text-[var(--color-text)]">{user?.name || "Anjali Verma"}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Receptionist <StatusBadge className="ml-2" status="active">Active</StatusBadge></p>
          </div>
          <TagChip className="ml-auto" tone="gray">Current user</TagChip>
        </div>
        <div className="mt-[var(--space-5)] grid gap-[var(--space-3)] md:grid-cols-2">
          <LockedField label="Full name" value={user?.name || "Anjali Verma"} />
          <LockedField label="Phone number" value="+91 98765 43210" />
          <LockedField label="Email address" value={user?.email || "anjali.verma@fitcrm.in"} />
          <LockedField label="Staff ID" value="STF-004" />
        </div>
      </Card>
      <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
        <InfoCard icon={Shield} title="Access context" rows={[["Assigned role", "Receptionist"], ["Default branch", "Andheri West"], ["Branch access", "Andheri West"], ["Data scope", "Current branch only"]]} note="Your role and branch determine which records and actions are available." />
        <InfoCard icon={UserRoundCog} title="Account status" rows={[["Status", "Active"], ["Account created", "12 Aug 2026"], ["Last sign-in", "30 Aug 2026, 10:42 AM"], ["Signed-in email", user?.email || "anjali.verma@fitcrm.in"]]} />
      </div>
      <Card className="p-[var(--card-padding)]">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Current sign-in</h2>
        <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-5)] rounded-[var(--radius-md)] border border-[var(--color-border)] px-[var(--space-4)] py-3 text-sm">
          <span className="font-semibold text-[var(--color-text)]">Chrome on macOS</span>
          <span className="inline-flex items-center gap-2 text-[var(--color-text)]"><MapPin className="size-[var(--icon-sm)]" />Mumbai, India</span>
          <StatusBadge status="active">Active now</StatusBadge>
          <span className="text-[var(--color-text)]">This browser session</span>
          <Button className="ml-auto gap-2 border-[var(--color-danger-border)] text-[var(--color-danger)]" variant="secondary"><LockKeyhole className="size-[var(--icon-sm)]" />Sign out</Button>
        </div>
        <div className="mt-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-subtle)] px-[var(--space-4)] py-3 text-sm text-[var(--color-text-secondary)]">
          <Lock className="mr-2 inline size-[var(--icon-sm)] text-[var(--color-primary)]" />
          To change your password, recover your account or update access, contact your administrator.
        </div>
      </Card>
      <Card className="p-[var(--card-padding)]">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]"><ShieldCheck className="size-[var(--icon-md)]" />Account protection</h2>
        <div className="mt-[var(--space-4)] grid gap-3 text-sm font-medium text-[var(--color-text)]">
          <p><Lock className="mr-3 inline size-[var(--icon-sm)]" />Use a private device for staff access</p>
          <p><LockKeyhole className="mr-3 inline size-[var(--icon-sm)]" />Sign out when using a shared reception system</p>
          <p><Shield className="mr-3 inline size-[var(--icon-sm)]" />Contact an administrator if you notice unfamiliar account activity</p>
        </div>
      </Card>
    </SettingsContentHeader>
  );
}

function SettingsSectionFrame({
  actionLabel,
  children,
  description,
  onAction,
  title,
}: {
  actionLabel?: string;
  children: React.ReactNode;
  description: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <SettingsContentHeader description={description} title={title}>
      {actionLabel ? (
        <div className="absolute right-0 top-0">
          <Button className="gap-2" onClick={onAction}>
            <Plus className="size-[var(--icon-sm)]" />
            {actionLabel}
          </Button>
        </div>
      ) : null}
      {children}
    </SettingsContentHeader>
  );
}

function SettingsContentHeader({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="relative space-y-[var(--space-6)]">
      <div className="pr-36">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
      </div>
      {children}
    </div>
  );
}

function InfoBanner({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-subtle)] px-[var(--space-4)] py-[var(--space-3)] text-sm font-semibold text-[var(--color-primary)]">
      <Icon className="size-[var(--icon-md)]" />
      <span className="min-w-0 flex-1">{text}</span>
      <X className="size-[var(--icon-sm)] text-[var(--color-text-secondary)]" />
    </div>
  );
}

function SettingsDataTable({
  children,
  count,
  searchPlaceholder,
  sortValue,
}: {
  children: React.ReactNode;
  count: string;
  searchPlaceholder: string;
  sortValue: string;
}) {
  return (
    <Card className="overflow-hidden p-[var(--space-4)]">
      <Toolbar count={count} searchPlaceholder={searchPlaceholder}>
        <ReportFilter options={["All usage", "Members", "Leads"]} value="All usage" />
        <ReportFilter options={["All statuses", "Active", "Inactive"]} value="All statuses" />
        <SortControl value={sortValue} />
      </Toolbar>
      <div className="mt-[var(--space-4)] overflow-x-auto">{children}</div>
    </Card>
  );
}

function Toolbar({
  children,
  count,
  searchPlaceholder,
}: {
  children: React.ReactNode;
  count: string;
  searchPlaceholder: string;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] items-center gap-[var(--space-3)]">
      <label className="relative block min-w-0">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
        <Input className="w-full pl-11" placeholder={searchPlaceholder} type="search" />
      </label>
      {children}
      <span className="text-sm text-[var(--color-text-secondary)]">{count}</span>
    </div>
  );
}

function ReportFilter({ options, value }: { options: string[]; value: string }) {
  const [selected, setSelected] = useState(value);

  return (
    <FilterSelect
      className="w-full"
      label={selected}
      onChange={(event) => setSelected(event.target.value)}
      options={options.map((option) => ({ label: option, value: option }))}
      value={selected}
    />
  );
}

function SortControl({ value }: { value: string }) {
  const [selected, setSelected] = useState(value);

  return (
    <div className="flex items-center justify-end gap-2 text-sm text-[var(--color-text-secondary)]">
      Sort by
      <FilterSelect
        label={selected}
        onChange={(event) => setSelected(event.target.value)}
        options={["Name", "Last updated", "Usage"].map((option) => ({ label: option, value: option }))}
        value={selected}
      />
    </div>
  );
}

function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr className="border-y border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-bold text-[var(--color-text)]">
        {columns.map((column, index) => (
          <th className={cn("px-[var(--space-4)] py-3", index === columns.length - 1 && "text-right")} key={column}>
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function ToneIcon({
  icon: Icon,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full",
        tone === "blue" && "bg-[var(--blue-100)] text-[var(--color-primary)]",
        tone === "purple" && "bg-[var(--color-trial-surface)] text-[var(--color-trial)]",
        tone === "orange" && "bg-[var(--color-warning-surface)] text-[var(--color-warning)]",
        tone === "green" && "bg-[var(--color-success-surface)] text-[var(--color-success)]",
        tone === "red" && "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
        tone === "teal" && "bg-[var(--color-info-surface)] text-[var(--color-info)]",
      )}
    >
      <Icon className="size-[var(--icon-md)]" />
    </span>
  );
}

function TagChip({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[var(--badge-height)] items-center gap-1 rounded-[var(--badge-radius)] px-[var(--badge-padding-x)] text-xs font-semibold",
        tone === "blue" && "bg-[var(--blue-100)] text-[var(--color-primary)]",
        tone === "purple" && "bg-[var(--color-trial-surface)] text-[var(--color-trial)]",
        tone === "orange" && "bg-[var(--color-warning-surface)] text-[var(--color-warning)]",
        tone === "green" && "bg-[var(--color-success-surface)] text-[var(--color-success)]",
        tone === "teal" && "bg-[var(--color-info-surface)] text-[var(--color-info)]",
        tone === "gray" && "bg-[var(--gray-100)] text-[var(--color-text-secondary)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

function SettingStatus({ active }: { active: boolean }) {
  if (active) return <StatusBadge status="active">Active</StatusBadge>;
  return <StatusBadge status="lost">Inactive</StatusBadge>;
}

function RowActions() {
  return (
    <td className="px-[var(--space-4)] py-[var(--space-4)] text-right">
      <button className="inline-grid size-8 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]" type="button" aria-label="Open row actions">
        <MoreVertical className="size-[var(--icon-sm)]" />
      </button>
    </td>
  );
}

function AvailabilityColumn({ branch, items }: { branch: string; items: string[] }) {
  return (
    <div className="border-r border-[var(--color-divider)] pr-[var(--space-5)] last:border-r-0">
      <h3 className="text-sm font-bold text-[var(--color-text)]">{branch}</h3>
      <div className="mt-[var(--space-3)] flex flex-wrap gap-2">
        {items.map((item) => (
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[var(--color-primary-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]" key={item}>
            <CheckCircle2 className="size-3.5" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function UsageBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-4 font-bold">{value}</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--gray-200)]">
        <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.min(value * 10, 100)}%` }} />
      </div>
    </div>
  );
}

function UsageSummary({
  description,
  firstLabel,
  firstValue,
  note,
  secondLabel,
  secondValue,
  title,
}: {
  description: string;
  firstLabel: string;
  firstValue: string;
  note: string;
  secondLabel: string;
  secondValue: string;
  title: string;
}) {
  return (
    <Card className="p-[var(--card-padding)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-4)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
        </div>
        <Button variant="secondary">View assigned profiles</Button>
      </div>
      <div className="mt-[var(--space-5)] grid gap-[var(--space-4)] md:grid-cols-3">
        <SummaryTile icon={UsersRound} label={firstLabel} value={firstValue} />
        <SummaryTile icon={UsersRound} label={secondLabel} value={secondValue} tone="purple" />
        <div className="rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-subtle)] p-[var(--space-4)] text-sm text-[var(--color-text-secondary)]">
          <Info className="mr-2 inline size-[var(--icon-sm)] text-[var(--color-primary)]" />
          {note}
        </div>
      </div>
    </Card>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  tone = "blue",
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: "blue" | "purple";
  value: string;
}) {
  return (
    <div className="flex items-center gap-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-[var(--space-4)]">
      <Icon className={cn("size-[var(--icon-lg)]", tone === "purple" ? "text-[var(--color-trial)]" : "text-[var(--color-primary)]")} />
      <div>
        <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
        <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
      </div>
    </div>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--color-border)] px-[var(--space-4)] py-3 text-sm">
      <span className="w-28 shrink-0 text-[var(--color-text-secondary)]">{label}</span>
      <span className="min-w-0 flex-1 truncate font-semibold text-[var(--color-text)]">{value}</span>
      <Lock className="size-[var(--icon-sm)] text-[var(--color-text-muted)]" />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  note,
  rows,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  note?: string;
  rows: Array<[string, string]>;
  title: string;
}) {
  return (
    <Card className="p-[var(--card-padding)]">
      <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
        <Icon className="size-[var(--icon-md)]" />
        {title}
      </h2>
      <div className="mt-[var(--space-4)] divide-y divide-[var(--color-divider)] text-sm">
        {rows.map(([label, value]) => (
          <div className="flex justify-between gap-[var(--space-4)] py-2" key={label}>
            <span className="text-[var(--color-text-secondary)]">{label}</span>
            <span className="font-semibold text-[var(--color-text)]">{value}</span>
          </div>
        ))}
      </div>
      {note ? <p className="mt-[var(--space-3)] text-xs text-[var(--color-text-secondary)]">{note}</p> : null}
    </Card>
  );
}
