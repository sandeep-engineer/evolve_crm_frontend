"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  ClipboardCheck,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundCog,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
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

type StaffAttendance = "PRESENT" | "NOT_CHECKED_IN";

type StaffRow = {
  id: string;
  name: string;
  branch: string;
  role: string;
  phone: string;
  programs: string[];
  batches: string[];
  status: "ACTIVE" | "INACTIVE";
  attendance: StaffAttendance;
  attendanceNote: string;
  tone: "blue" | "green" | "orange" | "purple" | "red" | "teal";
};

const staffRows: StaffRow[] = [
  {
    id: "staff-1",
    name: "Rohit Nair",
    branch: "Andheri West",
    role: "Trainer - Calisthenics",
    phone: "+91 98700 11001",
    programs: ["Calisthenics"],
    batches: ["6:00 AM - 7:00 AM", "7:00 AM - 8:00 AM"],
    status: "ACTIVE",
    attendance: "PRESENT",
    attendanceNote: "Check-in: 5:52 AM",
    tone: "purple",
  },
  {
    id: "staff-2",
    name: "Sunita Rao",
    branch: "Bandra",
    role: "Trainer - MMA",
    phone: "+91 98700 22002",
    programs: ["MMA"],
    batches: ["8:00 AM - 9:00 AM", "9:00 AM - 10:00 AM"],
    status: "ACTIVE",
    attendance: "PRESENT",
    attendanceNote: "Check-in: 7:48 AM",
    tone: "blue",
  },
  {
    id: "staff-3",
    name: "Deepak Yadav",
    branch: "Powai",
    role: "Trainer - MMA",
    phone: "+91 98700 33003",
    programs: ["MMA"],
    batches: ["5:00 PM - 6:00 PM", "6:00 PM - 7:00 PM"],
    status: "ACTIVE",
    attendance: "NOT_CHECKED_IN",
    attendanceNote: "Scheduled at 5:00 PM",
    tone: "orange",
  },
  {
    id: "staff-4",
    name: "Farah Khan",
    branch: "Koramangala",
    role: "Trainer - Calisthenics",
    phone: "+91 98700 44004",
    programs: ["Calisthenics"],
    batches: ["7:00 PM - 8:00 PM", "8:00 PM - 9:00 PM"],
    status: "ACTIVE",
    attendance: "PRESENT",
    attendanceNote: "Check-in: 6:47 PM",
    tone: "green",
  },
];

const roleOptions = [
  { label: "All roles", value: "" },
  { label: "Trainer", value: "Trainer" },
  { label: "Receptionist", value: "Receptionist" },
  { label: "Admin", value: "Admin" },
];

const programOptions = [
  { label: "All programs", value: "" },
  { label: "Calisthenics", value: "Calisthenics" },
  { label: "MMA", value: "MMA" },
  { label: "Yoga", value: "Yoga" },
];

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const batchOptions = [
  { label: "All batches", value: "" },
  { label: "Morning", value: "AM" },
  { label: "Evening", value: "PM" },
];

const sortOptions = [
  { label: "Recently Added", value: "RECENT" },
  { label: "Name", value: "NAME" },
  { label: "Attendance", value: "ATTENDANCE" },
];

export function StaffScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<"DIRECTORY" | "ATTENDANCE">("DIRECTORY");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [program, setProgram] = useState("");
  const [status, setStatus] = useState("");
  const [batch, setBatch] = useState("");
  const [sort, setSort] = useState("RECENT");
  const [openMenuId, setOpenMenuId] = useState("staff-4");

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    return staffRows
      .filter((staff) => {
        const matchesSearch = query
          ? `${staff.name} ${staff.phone} ${staff.id} ${staff.branch}`.toLowerCase().includes(query)
          : true;
        const matchesRole = role ? staff.role.includes(role) : true;
        const matchesProgram = program ? staff.programs.includes(program) : true;
        const matchesStatus = status ? staff.status === status : true;
        const matchesBatch = batch ? staff.batches.some((item) => item.includes(batch)) : true;

        return matchesSearch && matchesRole && matchesProgram && matchesStatus && matchesBatch;
      })
      .sort((a, b) => {
        if (sort === "NAME") return a.name.localeCompare(b.name);
        if (sort === "ATTENDANCE") return a.attendance.localeCompare(b.attendance);
        return 0;
      });
  }, [batch, program, role, search, sort, status]);

  return (
    <AppShell user={user}>
      <div className="space-y-[var(--space-6)]">
        <PageHeader
          title="Staff"
          description="Manage trainers, staff assignments and attendance."
          actions={
            <Button className="gap-2">
              <Plus className="size-[var(--icon-sm)]" />
              Add Staff
            </Button>
          }
        />

        <div className="border-b border-[var(--color-divider)]">
          <div className="flex flex-wrap gap-x-[var(--space-5)]">
            <TabButton active={activeTab === "DIRECTORY"} onClick={() => setActiveTab("DIRECTORY")}>
              Directory
              <span className="ml-2 rounded-[var(--radius-full)] bg-[var(--blue-100)] px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                4
              </span>
            </TabButton>
            <TabButton active={activeTab === "ATTENDANCE"} onClick={() => setActiveTab("ATTENDANCE")}>
              Attendance
            </TabButton>
          </div>
        </div>

        <Card className="p-[var(--space-4)]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-[var(--space-3)] xl:items-center">
            <label className="relative block min-w-0 xl:col-span-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input
                className="w-full pl-11"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, phone or staff ID"
                type="search"
                value={search}
              />
            </label>
            <FilterSelect className="w-full" label={roleLabel(role)} onChange={(event) => setRole(event.target.value)} options={roleOptions} value={role} />
            <FilterSelect className="w-full" label={programLabel(program)} onChange={(event) => setProgram(event.target.value)} options={programOptions} value={program} />
            <FilterSelect className="w-full" label={statusLabel(status)} onChange={(event) => setStatus(event.target.value)} options={statusOptions} value={status} />
            <FilterSelect className="w-full" label={batchLabel(batch)} onChange={(event) => setBatch(event.target.value)} options={batchOptions} value={batch} />
            <div className="flex items-center justify-end gap-2 text-sm text-[var(--color-text-secondary)]">
              Sort by
              <FilterSelect label={sortLabel(sort)} onChange={(event) => setSort(event.target.value)} options={sortOptions} value={sort} />
            </div>
          </div>
        </Card>

        {activeTab === "DIRECTORY" ? (
          <DirectoryTable rows={filteredStaff} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
        ) : (
          <StaffAttendanceView rows={filteredStaff} />
        )}
      </div>
    </AppShell>
  );
}

function DirectoryTable({
  openMenuId,
  rows,
  setOpenMenuId,
}: {
  openMenuId: string;
  rows: StaffRow[];
  setOpenMenuId: (id: string) => void;
}) {
  return (
    <div className="space-y-[var(--space-4)]">
      <p className="text-sm text-[var(--color-text-secondary)]">
        <strong className="text-[var(--color-text)]">{rows.length}</strong> staff members
      </p>
      <Card className="overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-bold text-[var(--color-text)]">
                <th className="px-[var(--space-4)] py-[var(--space-4)]">
                  <input className="size-4 rounded border-[var(--color-border)]" type="checkbox" aria-label="Select all staff" />
                </th>
                <th className="px-[var(--space-4)] py-[var(--space-4)]">Staff</th>
                <th className="px-[var(--space-4)] py-[var(--space-4)]">Role / Designation</th>
                <th className="px-[var(--space-4)] py-[var(--space-4)]">Phone</th>
                <th className="px-[var(--space-4)] py-[var(--space-4)]">Assigned Programs</th>
                <th className="px-[var(--space-4)] py-[var(--space-4)]">Assigned Batches</th>
                <th className="px-[var(--space-4)] py-[var(--space-4)]">Status</th>
                <th className="px-[var(--space-4)] py-[var(--space-4)]">Today's Attendance</th>
                <th className="px-[var(--space-4)] py-[var(--space-4)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((staff) => (
                <tr className="border-b border-[var(--color-divider)] last:border-0" key={staff.id}>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]">
                    <input className="size-4 rounded border-[var(--color-border)]" type="checkbox" aria-label={`Select ${staff.name}`} />
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]">
                    <div className="flex items-center gap-[var(--space-3)]">
                      <InitialAvatar className="size-11 text-sm" name={staff.name} tone={staff.tone} />
                      <div>
                        <p className="font-bold text-[var(--color-text)]">{staff.name}</p>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{staff.branch}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{staff.role}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">{staff.phone}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]">
                    {staff.programs.map((item) => (
                      <TagChip key={item}>{item}</TagChip>
                    ))}
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]">
                    <p className="text-[var(--color-text)]">{staff.batches[0]}</p>
                    {staff.batches.length > 1 ? <span className="mt-1 inline-flex rounded-[var(--radius-sm)] bg-[var(--gray-100)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">+{staff.batches.length - 1} more</span> : null}
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]">
                    <StatusBadge status="active">Active</StatusBadge>
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-4)]">
                    <AttendanceState state={staff.attendance} note={staff.attendanceNote} />
                  </td>
                  <td className="relative px-[var(--space-4)] py-[var(--space-4)] text-right">
                    <button
                      className="inline-grid size-9 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]"
                      onClick={() => setOpenMenuId(openMenuId === staff.id ? "" : staff.id)}
                      type="button"
                      aria-label={`Open actions for ${staff.name}`}
                    >
                      <MoreVertical className="size-[var(--icon-sm)]" />
                    </button>
                    {openMenuId === staff.id ? <ActionMenu /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StaffAttendanceView({ rows }: { rows: StaffRow[] }) {
  return (
    <div className="grid gap-[var(--space-4)] lg:grid-cols-4">
      {rows.map((staff) => (
        <Card className="p-[var(--card-padding)]" key={staff.id}>
          <div className="flex items-start gap-[var(--space-3)]">
            <InitialAvatar name={staff.name} tone={staff.tone} />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[var(--color-text)]">{staff.name}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{staff.role}</p>
            </div>
          </div>
          <div className="mt-[var(--space-4)]">
            <AttendanceState state={staff.attendance} note={staff.attendanceNote} />
          </div>
          <div className="mt-[var(--space-4)] rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-secondary)]">
            {staff.batches.join(", ")}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ActionMenu() {
  const items = [
    { label: "View profile", icon: UserRoundCog },
    { label: "Edit staff", icon: Pencil },
    { label: "Assign batches", icon: WalletCards },
    { label: "View attendance", icon: CalendarCheck },
  ];

  return (
    <div className="absolute right-4 top-14 z-20 w-48 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 text-left shadow-[var(--shadow-lg)]">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button className="flex h-10 w-full items-center gap-3 px-4 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]" key={item.label} type="button">
            <Icon className="size-[var(--icon-sm)] text-[var(--color-text-secondary)]" />
            {item.label}
          </button>
        );
      })}
      <div className="my-2 border-t border-[var(--color-divider)]" />
      <button className="flex h-10 w-full items-center gap-3 px-4 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)]" type="button">
        <Trash2 className="size-[var(--icon-sm)]" />
        Deactivate
      </button>
    </div>
  );
}

function AttendanceState({ note, state }: { note: string; state: StaffAttendance }) {
  const present = state === "PRESENT";
  return (
    <div>
      <p className={cn("flex items-center gap-2 font-semibold", present ? "text-[var(--color-success)]" : "text-[var(--color-warning)]")}>
        <span className={cn("size-2 rounded-full", present ? "bg-[var(--color-success)]" : "bg-[var(--color-warning)]")} />
        {present ? "Present" : "Not checked in"}
      </p>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{note}</p>
    </div>
  );
}

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[var(--badge-height)] items-center rounded-[var(--badge-radius)] bg-[var(--blue-100)] px-[var(--badge-padding-x)] text-xs font-semibold text-[var(--color-primary)]">
      {children}
    </span>
  );
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
        "inline-flex h-12 items-center border-b-2 px-[var(--space-3)] text-sm font-bold transition",
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

function roleLabel(value: string) {
  return roleOptions.find((item) => item.value === value)?.label ?? "All roles";
}

function programLabel(value: string) {
  return programOptions.find((item) => item.value === value)?.label ?? "All programs";
}

function statusLabel(value: string) {
  return statusOptions.find((item) => item.value === value)?.label ?? "All statuses";
}

function batchLabel(value: string) {
  return batchOptions.find((item) => item.value === value)?.label ?? "All batches";
}

function sortLabel(value: string) {
  return sortOptions.find((item) => item.value === value)?.label ?? "Recently Added";
}
