"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Download,
  Filter,
  Hand,
  MoreVertical,
  QrCode,
  ScanFace,
  Search,
  Smartphone,
  Timer,
  TrendingUp,
  UserCheck,
  UserRoundX,
  UsersRound,
  Wifi,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/filter-select";
import { InitialAvatar } from "@/components/ui/initial-avatar";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AuthUser } from "@/lib/api/auth";
import { getStoredUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";
type CheckInMethod = "QR Code Scan" | "Face Recognition" | "RFID Card" | "Manual";

type AttendanceRow = {
  id: string;
  member: string;
  phone: string;
  program: string;
  batch: string;
  trainer: string;
  checkIn?: string;
  checkOut?: string;
  duration?: string;
  method: CheckInMethod;
  status: AttendanceStatus;
};

const attendanceRows: AttendanceRow[] = [
  {
    id: "att-1",
    member: "Aarav Shah",
    phone: "+91 98851 27851",
    program: "Calisthenics",
    batch: "Morning · 6:00 AM-7:00 AM",
    trainer: "Rohit Nair",
    checkIn: "6:08 AM",
    checkOut: "6:56 AM",
    duration: "48m",
    method: "QR Code Scan",
    status: "PRESENT",
  },
  {
    id: "att-2",
    member: "Naina Kapoor",
    phone: "+91 98852 27852",
    program: "Calisthenics",
    batch: "Morning · 6:00 AM-7:00 AM",
    trainer: "Rohit Nair",
    checkIn: "6:07 AM",
    checkOut: "6:56 AM",
    duration: "49m",
    method: "Face Recognition",
    status: "PRESENT",
  },
  {
    id: "att-3",
    member: "Arjun Nair",
    phone: "+91 98853 27853",
    program: "Calisthenics",
    batch: "Morning · 6:00 AM-7:00 AM",
    trainer: "Rohit Nair",
    checkIn: "6:01 AM",
    checkOut: "6:56 AM",
    duration: "55m",
    method: "Face Recognition",
    status: "PRESENT",
  },
  {
    id: "att-4",
    member: "Myra Chawla",
    phone: "+91 98854 27854",
    program: "Calisthenics",
    batch: "Morning · 6:00 AM-7:00 AM",
    trainer: "Rohit Nair",
    checkIn: "6:01 AM",
    checkOut: "6:56 AM",
    duration: "55m",
    method: "QR Code Scan",
    status: "LATE",
  },
  {
    id: "att-5",
    member: "Krishna Rao",
    phone: "+91 98855 27855",
    program: "MMA",
    batch: "Morning · 7:00 AM-8:00 AM",
    trainer: "Sunita Rao",
    checkIn: "7:04 AM",
    checkOut: "7:58 AM",
    duration: "54m",
    method: "RFID Card",
    status: "PRESENT",
  },
  {
    id: "att-6",
    member: "Sana Mehta",
    phone: "+91 98856 27856",
    program: "MMA",
    batch: "Morning · 7:00 AM-8:00 AM",
    trainer: "Sunita Rao",
    method: "Manual",
    status: "ABSENT",
  },
];

const programOptions = [
  { label: "All programs", value: "" },
  { label: "Calisthenics", value: "Calisthenics" },
  { label: "MMA", value: "MMA" },
  { label: "Yoga", value: "Yoga" },
  { label: "Zumba", value: "Zumba" },
];

const trainerOptions = [
  { label: "All trainers", value: "" },
  { label: "Rohit Nair", value: "Rohit Nair" },
  { label: "Sunita Rao", value: "Sunita Rao" },
  { label: "Deepak Yadav", value: "Deepak Yadav" },
  { label: "Farah Khan", value: "Farah Khan" },
];

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Present", value: "PRESENT" },
  { label: "Late", value: "LATE" },
  { label: "Absent", value: "ABSENT" },
];

const methodOptions = [
  { label: "All methods", value: "" },
  { label: "QR Code Scan", value: "QR Code Scan" },
  { label: "Face Recognition", value: "Face Recognition" },
  { label: "RFID Card", value: "RFID Card" },
  { label: "Manual", value: "Manual" },
];

const sortOptions = [
  { label: "Check-in time", value: "CHECK_IN" },
  { label: "Member name", value: "MEMBER" },
  { label: "Status", value: "STATUS" },
];

export function AttendanceScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<"DAILY" | "FOLLOW_UPS">("DAILY");
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("");
  const [trainer, setTrainer] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [sort, setSort] = useState("CHECK_IN");

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return attendanceRows
      .filter((row) => {
        const matchesSearch = query
          ? `${row.member} ${row.phone} ${row.program} ${row.trainer}`.toLowerCase().includes(query)
          : true;
        const matchesProgram = program ? row.program === program : true;
        const matchesTrainer = trainer ? row.trainer === trainer : true;
        const matchesStatus = status ? row.status === status : true;
        const matchesMethod = method ? row.method === method : true;

        return matchesSearch && matchesProgram && matchesTrainer && matchesStatus && matchesMethod;
      })
      .sort((a, b) => {
        if (sort === "MEMBER") return a.member.localeCompare(b.member);
        if (sort === "STATUS") return a.status.localeCompare(b.status);
        return timeValue(a.checkIn) - timeValue(b.checkIn);
      });
  }, [method, program, search, sort, status, trainer]);

  return (
    <AppShell user={user}>
      <div className="space-y-[var(--space-6)]">
        <PageHeader
          title="Attendance Handling"
          description="Monitor check-ins, batch attendance and member follow-ups."
          actions={
            <div className="flex flex-wrap justify-end gap-[var(--space-3)]">
              <div className="inline-flex h-[var(--control-height-md)] items-center gap-2 whitespace-nowrap rounded-[var(--control-radius)] border border-[var(--color-success-border)] bg-[var(--color-success-surface)] px-[var(--control-padding-x)] text-sm font-bold text-[var(--color-success)]">
                <span className="size-2 rounded-full bg-[var(--color-success)]" />
                Biometric Sync: Online
              </div>
              <Button className="gap-2 whitespace-nowrap" variant="secondary">
                <Download className="size-[var(--icon-sm)]" />
                Export
              </Button>
            </div>
          }
        />

        <section className="grid grid-cols-[repeat(auto-fit,minmax(13.5rem,1fr))] gap-[var(--space-4)]">
          <StatCard icon={UserCheck} note="Checked in" title="Present Today" tone="green" value="152" />
          <StatCard icon={UserRoundX} note="No check-in" title="Absent Today" tone="red" value="58" />
          <StatCard icon={Timer} note="After grace" title="Late Check-ins" tone="amber" value="29" />
          <StatCard icon={CalendarCheck} note="Running now" title="Active Batches Today" tone="blue" value="14" />
          <StatCard icon={TrendingUp} note="Across expected" title="Average Attendance Rate" tone="violet" value="72%" />
          <StatCard icon={UsersRound} note="Action needed" title="Members Needing Follow-up" tone="red" value="3" />
          <StatCard icon={Smartphone} note="Device reachable" title="Biometric Sync Status" tone="green" value="Online" />
        </section>

        <div className="border-b border-[var(--color-divider)]">
          <div className="flex flex-wrap gap-x-[var(--space-6)] gap-y-0">
            <TabButton active={activeTab === "DAILY"} onClick={() => setActiveTab("DAILY")}>
              Daily Attendance
            </TabButton>
            <TabButton active={activeTab === "FOLLOW_UPS"} onClick={() => setActiveTab("FOLLOW_UPS")}>
              Attendance Follow-ups
              <span className="ml-2 rounded-[var(--radius-full)] bg-[var(--blue-100)] px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                3
              </span>
            </TabButton>
          </div>
        </div>

        <Card className="p-[var(--space-4)]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-[var(--space-3)] xl:items-end">
            <FilterField className="min-w-0" label="Date">
              <Button className="w-full justify-start gap-2" variant="secondary">
                23 Aug 2026
                <CalendarDays className="ml-auto size-[var(--icon-sm)]" />
              </Button>
            </FilterField>
            <FilterField className="min-w-0" label="Program">
              <FilterSelect className="w-full" label={program || "All programs"} onChange={(event) => setProgram(event.target.value)} options={programOptions} value={program} />
            </FilterField>
            <FilterField className="min-w-0" label="Trainer">
              <FilterSelect className="w-full" label={trainer || "All trainers"} onChange={(event) => setTrainer(event.target.value)} options={trainerOptions} value={trainer} />
            </FilterField>
            <FilterField className="min-w-0" label="Status">
              <FilterSelect className="w-full" label={statusLabel(status)} onChange={(event) => setStatus(event.target.value)} options={statusOptions} value={status} />
            </FilterField>
            <FilterField className="min-w-0" label="Check-in method">
              <FilterSelect className="w-full" label={method || "All methods"} onChange={(event) => setMethod(event.target.value)} options={methodOptions} value={method} />
            </FilterField>
            <label className="relative block min-w-0 sm:col-span-2 xl:col-span-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input className="w-full pl-11" onChange={(event) => setSearch(event.target.value)} placeholder="Search member or phone" type="search" value={search} />
            </label>
            <Button className="w-full gap-2 whitespace-nowrap" variant="secondary">
              <Filter className="size-[var(--icon-sm)]" />
              More Filters
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-[var(--space-3)] xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-x-[var(--space-5)] gap-y-2 text-sm text-[var(--color-text-secondary)]">
            <strong className="text-[var(--color-text)]">210 expected</strong>
            <strong className="text-[var(--color-success)]">152 present</strong>
            <strong className="text-[var(--color-danger)]">58 absent</strong>
            <strong className="text-[var(--color-primary)]">72% attendance</strong>
            <strong className="text-[var(--color-warning)]">29 late check-ins</strong>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            Sort by
            <FilterSelect className="min-w-44" label={sortOptions.find((option) => option.value === sort)?.label ?? "Check-in time"} onChange={(event) => setSort(event.target.value)} options={sortOptions} value={sort} />
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === "DAILY" ? (
              <AttendanceTable rows={visibleRows} />
            ) : (
              <FollowUpsPanel />
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function AttendanceTable({ rows }: { rows: AttendanceRow[] }) {
  return (
    <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-bold text-[var(--color-text)]">
          <th className="px-[var(--space-4)] py-[var(--space-4)]">
            <input className="size-4 rounded border-[var(--color-border)]" type="checkbox" aria-label="Select all attendance rows" />
          </th>
          <th className="px-[var(--space-4)] py-[var(--space-4)]">Member</th>
          <th className="px-[var(--space-4)] py-[var(--space-4)]">Program / Batch</th>
          <th className="px-[var(--space-4)] py-[var(--space-4)]">Trainer</th>
          <th className="px-[var(--space-4)] py-[var(--space-4)]">Check-in</th>
          <th className="px-[var(--space-4)] py-[var(--space-4)]">Check-out</th>
          <th className="px-[var(--space-4)] py-[var(--space-4)]">Duration</th>
          <th className="px-[var(--space-4)] py-[var(--space-4)]">Method</th>
          <th className="px-[var(--space-4)] py-[var(--space-4)]">Status</th>
          <th className="px-[var(--space-4)] py-[var(--space-4)] text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr className="border-b border-[var(--color-divider)] last:border-0" key={row.id}>
            <td className="px-[var(--space-4)] py-[var(--space-4)]">
              <input className="size-4 rounded border-[var(--color-border)]" type="checkbox" aria-label={`Select ${row.member}`} />
            </td>
            <td className="px-[var(--space-4)] py-[var(--space-4)]">
              <div className="flex items-center gap-[var(--space-3)]">
                <InitialAvatar name={row.member} tone={avatarTones[index % avatarTones.length]} />
                <div>
                  <p className="font-bold text-[var(--color-text)]">{row.member}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{row.phone}</p>
                </div>
              </div>
            </td>
            <td className="px-[var(--space-4)] py-[var(--space-4)]">
              <p className="font-medium text-[var(--color-text)]">{row.program}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{row.batch}</p>
            </td>
            <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{row.trainer}</td>
            <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{row.checkIn ?? "-"}</td>
            <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{row.checkOut ?? "-"}</td>
            <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{row.duration ?? "-"}</td>
            <td className="px-[var(--space-4)] py-[var(--space-4)]">
              <div className="inline-flex items-center gap-2 text-[var(--color-text)]">
                <MethodIcon method={row.method} />
                {row.method}
              </div>
            </td>
            <td className="px-[var(--space-4)] py-[var(--space-4)]">
              <AttendanceBadge status={row.status} />
            </td>
            <td className="px-[var(--space-4)] py-[var(--space-4)] text-right">
              <button className="inline-grid size-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]" type="button" aria-label={`Open actions for ${row.member}`}>
                <MoreVertical className="size-[var(--icon-sm)]" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FollowUpsPanel() {
  return (
    <div className="grid gap-[var(--space-3)] p-[var(--space-4)]">
      {["Sana Mehta missed 3 sessions this week", "Rahul Sharma attendance dropped below 60%", "Meera Nair needs check-in confirmation"].map((item) => (
        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-[var(--space-4)] py-[var(--space-3)]" key={item}>
          <p className="text-sm font-semibold text-[var(--color-text)]">{item}</p>
          <Button variant="secondary">Follow up</Button>
        </div>
      ))}
    </div>
  );
}

function MethodIcon({ method }: { method: CheckInMethod }) {
  const className = "size-[var(--icon-sm)] text-[var(--color-text-secondary)]";
  if (method === "QR Code Scan") return <QrCode className={className} />;
  if (method === "Face Recognition") return <ScanFace className={className} />;
  if (method === "RFID Card") return <Wifi className={className} />;
  return <Hand className={className} />;
}

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  if (status === "PRESENT") return <StatusBadge status="active">Present</StatusBadge>;
  if (status === "LATE") return <StatusBadge status="trial">Late</StatusBadge>;
  return <StatusBadge status="lost">Absent</StatusBadge>;
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-12 items-center border-b-2 px-[var(--space-4)] text-sm font-bold transition",
        active
          ? "border-[var(--color-primary)] text-[var(--color-primary)]"
          : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function FilterField({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-semibold text-[var(--color-text-muted)]">{label}</span>
      {children}
    </div>
  );
}

function statusLabel(status: string) {
  return statusOptions.find((option) => option.value === status)?.label ?? "All statuses";
}

function timeValue(time?: string) {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const [timePart, suffix] = time.split(" ");
  const [hourValue, minuteValue] = timePart.split(":");
  let hour = Number(hourValue);
  const minute = Number(minuteValue);
  if (suffix === "PM" && hour !== 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

const avatarTones: Array<"blue" | "green" | "orange" | "purple" | "red" | "teal"> = [
  "teal",
  "blue",
  "teal",
  "teal",
  "blue",
  "green",
];
