"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Armchair,
  CalendarDays,
  Grid2X2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  TriangleAlert,
  UserMinus,
  UserPlus,
  UserRoundPlus,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AuthUser } from "@/lib/api/auth";
import {
  assignStaffToBatch,
  createBatch,
  deleteBatch,
  getBatch,
  getBatchOccupancy,
  getBatches,
  getBatchStaff,
  unassignStaffFromBatch,
  updateBatch,
  type AssignedBatchStaff,
  type Batch,
  type BatchOccupancy,
  type CreateBatchPayload,
} from "@/lib/api/batches";
import { getPrograms, type Program } from "@/lib/api/programs";
import { getStaff, staffQueryForUser, type Staff } from "@/lib/api/staff";
import { getAccessToken, getStoredUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type BatchStatus = Batch["status"];
type FormMode = "create" | "edit";

type BatchFormState = {
  programId: string;
  name: string;
  startTime: string;
  endTime: string;
  daysPattern: string;
  trainerId: string;
  capacity: string;
  status: BatchStatus;
};

const emptyForm: BatchFormState = {
  programId: "",
  name: "",
  startTime: "06:00",
  endTime: "07:00",
  daysPattern: "M,T,W,Th,F",
  trainerId: "",
  capacity: "20",
  status: "ACTIVE",
};

const sessionOptions = [
  { label: "All sessions", value: "" },
  { label: "Morning", value: "MORNING" },
  { label: "Evening", value: "EVENING" },
];

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Full", value: "FULL" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Cancelled", value: "CANCELLED" },
];

const sortOptions = [
  { label: "Schedule", value: "SCHEDULE" },
  { label: "Occupancy", value: "OCCUPANCY" },
  { label: "Available seats", value: "AVAILABLE" },
];

export function BatchesScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [occupancyByBatch, setOccupancyByBatch] = useState<Record<string, BatchOccupancy>>({});
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("");
  const [session, setSession] = useState("");
  const [trainer, setTrainer] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("SCHEDULE");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [detailBatch, setDetailBatch] = useState<Batch | null>(null);
  const [detailStaff, setDetailStaff] = useState<AssignedBatchStaff[]>([]);
  const [staffToAssign, setStaffToAssign] = useState("");
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [form, setForm] = useState<BatchFormState>(emptyForm);

  const loadData = useCallback(async (accessToken: string, currentUser: AuthUser | null) => {

    setIsLoading(true);
    try {
      const staffQuery = staffQueryForUser(currentUser);
      const [batchData, programData, staffResult] = await Promise.all([
        getBatches(accessToken),
        getPrograms(accessToken),
        staffQuery ? getStaff(accessToken, staffQuery) : Promise.resolve(null),
      ]);

      const occupancyEntries = await Promise.all(
        batchData.map(async (batch) => {
          try {
            const occupancy = await getBatchOccupancy(accessToken, batch.id);
            return [batch.id, occupancy] as const;
          } catch {
            return [
              batch.id,
              {
                batchId: batch.id,
                capacity: batch.capacity,
                admitted: 0,
                availableSeats: batch.capacity,
              },
            ] as const;
          }
        }),
      );

      setBatches(batchData);
      setPrograms(programData);
      setStaff(staffResult?.data ?? []);
      setOccupancyByBatch(Object.fromEntries(occupancyEntries));
      setError("");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to load batches.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = getAccessToken();
      if (!accessToken) return;

      const currentUser = getStoredUser();
      setToken(accessToken);
      setUser(currentUser);
      void loadData(accessToken, currentUser);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const programOptions = useMemo(() => {
    return [
      { label: "All programs", value: "" },
      ...programs.map((item) => ({ label: item.name, value: item.id })),
    ];
  }, [programs]);

  const trainerOptions = useMemo(() => {
    const trainers = staff.filter((item) => item.role === "COACH");
    return [
      { label: "All trainers", value: "" },
      ...trainers.map((item) => ({ label: item.fullName, value: item.id })),
    ];
  }, [staff]);

  const formTrainerOptions = useMemo(() => {
    return [
      { label: "No trainer", value: "" },
      ...staff
        .filter((item) => item.role === "COACH")
        .map((item) => ({ label: item.fullName, value: item.id })),
    ];
  }, [staff]);

  const visibleBatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return batches
      .filter((batch) => {
        const programName = programNameFor(batch.programId, programs);
        const trainerName = trainerNameFor(batch.trainerId, staff);
        const matchesSearch = query
          ? `${batch.name} ${programName} ${trainerName} ${formatTimeRange(batch)}`.toLowerCase().includes(query)
          : true;
        const matchesProgram = program ? batch.programId === program : true;
        const matchesSession = session ? sessionFor(batch.startTime) === session : true;
        const matchesTrainer = trainer ? batch.trainerId === trainer : true;
        const matchesStatus = status ? batch.status === status : true;

        return matchesSearch && matchesProgram && matchesSession && matchesTrainer && matchesStatus;
      })
      .sort((a, b) => {
        if (sort === "OCCUPANCY") return occupancyPercent(occupancyByBatch[b.id]) - occupancyPercent(occupancyByBatch[a.id]);
        if (sort === "AVAILABLE") return availableSeats(occupancyByBatch[b.id], b) - availableSeats(occupancyByBatch[a.id], a);
        return a.startTime.localeCompare(b.startTime);
      });
  }, [batches, occupancyByBatch, program, programs, search, session, sort, staff, status, trainer]);

  const totals = useMemo(() => {
    const occupancyValues = batches.map((batch) => occupancyByBatch[batch.id]);
    const admissions = occupancyValues.reduce((sum, item) => sum + Number(item?.admitted ?? 0), 0);
    const capacity = batches.reduce((sum, batch) => sum + Number(occupancyByBatch[batch.id]?.capacity ?? batch.capacity), 0);
    const full = batches.filter((batch) => batch.status === "FULL" || occupancyPercent(occupancyByBatch[batch.id]) >= 90).length;

    return {
      admissions,
      attendance: Math.round(admissions * 0.7),
      available: Math.max(capacity - admissions, 0),
      full,
    };
  }, [batches, occupancyByBatch]);

  const openCreate = () => {
    setSelectedBatch(null);
    setForm({
      ...emptyForm,
      programId: program || programs[0]?.id || "",
    });
    setFormMode("create");
  };

  const openEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setDetailBatch(null);
    setForm({
      programId: batch.programId,
      name: batch.name,
      startTime: toTimeInput(batch.startTime),
      endTime: toTimeInput(batch.endTime),
      daysPattern: batch.daysPattern,
      trainerId: batch.trainerId ?? "",
      capacity: String(batch.capacity),
      status: batch.status,
    });
    setFormMode("edit");
  };

  const openDetail = async (batch: Batch) => {
    if (!token) return;
    try {
      const [freshBatch, assignedStaff] = await Promise.all([
        getBatch(token, batch.id),
        getBatchStaff(token, batch.id),
      ]);
      setDetailBatch(freshBatch);
      setDetailStaff(assignedStaff);
      setStaffToAssign("");
      setError("");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to load batch details.");
    }
  };

  const saveBatch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setIsSaving(true);
    try {
      const payload: CreateBatchPayload = {
        programId: form.programId,
        name: form.name.trim(),
        startTime: normalizeTime(form.startTime),
        endTime: normalizeTime(form.endTime),
        daysPattern: form.daysPattern.trim(),
        trainerId: form.trainerId || undefined,
        capacity: Number(form.capacity),
        status: form.status,
      };

      if (formMode === "edit" && selectedBatch) {
        await updateBatch(token, selectedBatch.id, payload);
        setNotice("Batch updated.");
      } else {
        await createBatch(token, payload);
        setNotice("Batch created.");
      }

      setFormMode(null);
      setSelectedBatch(null);
      await loadData(token, user);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to save batch.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !batchToDelete) return;

    setIsSaving(true);
    try {
      await deleteBatch(token, batchToDelete.id);
      setBatchToDelete(null);
      setDetailBatch(null);
      setNotice("Batch deleted.");
      await loadData(token, user);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to delete batch.");
    } finally {
      setIsSaving(false);
    }
  };

  const assignStaff = async () => {
    if (!token || !detailBatch || !staffToAssign) return;

    setIsSaving(true);
    try {
      await assignStaffToBatch(token, detailBatch.id, staffToAssign);
      setDetailStaff(await getBatchStaff(token, detailBatch.id));
      setStaffToAssign("");
      setNotice("Staff assigned to batch.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to assign staff.");
    } finally {
      setIsSaving(false);
    }
  };

  const unassignStaff = async (staffId: string) => {
    if (!token || !detailBatch) return;

    setIsSaving(true);
    try {
      await unassignStaffFromBatch(token, detailBatch.id, staffId);
      setDetailStaff(await getBatchStaff(token, detailBatch.id));
      setNotice("Staff removed from batch.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to remove staff.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell user={user}>
      <div className="space-y-[var(--space-6)]">
        <PageHeader
          title="Batches"
          description="Manage class schedules, trainers, capacity and attendance."
          actions={
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="size-[var(--icon-sm)]" />
              New Batch
            </Button>
          }
        />

        {error ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] px-[var(--space-4)] py-[var(--space-3)] text-sm font-semibold text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-success-border)] bg-[var(--color-success-surface)] px-[var(--space-4)] py-[var(--space-3)] text-sm font-semibold text-[var(--color-success)]">
            {notice}
          </div>
        ) : null}

        <section className="grid gap-[var(--space-4)] md:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={Grid2X2} note="Across active programs" title="Total Batches" tone="blue" value={batches.length} />
          <StatCard icon={UserRoundPlus} note="Currently enrolled" title="Total Admissions" tone="blue" value={totals.admissions} />
          <StatCard icon={TrendingUp} note="Derived from admissions" title="Today's Attendance" tone="green" value={totals.attendance} />
          <StatCard icon={TriangleAlert} note="90%+ occupancy" title="Full Batches" tone="amber" value={totals.full} />
          <StatCard icon={Armchair} note="Seats left now" title="Available Seats" tone="blue" value={totals.available} />
        </section>

        <Card className="p-[var(--space-4)]">
          <div className="grid gap-[var(--space-3)] xl:grid-cols-[minmax(14rem,1.5fr)_repeat(5,minmax(9rem,1fr))] xl:items-end">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input
                className="w-full pl-11"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search batch or trainer"
                type="search"
                value={search}
              />
            </label>
            <FilterField label="Program">
              <FilterSelect className="w-full" label={programNameFor(program, programs) || "All programs"} onChange={(event) => setProgram(event.target.value)} options={programOptions} value={program} />
            </FilterField>
            <FilterField label="Session">
              <FilterSelect className="w-full" label={sessionLabel(session)} onChange={(event) => setSession(event.target.value)} options={sessionOptions} value={session} />
            </FilterField>
            <FilterField label="Trainer">
              <FilterSelect className="w-full" label={trainerNameFor(trainer, staff) || "All trainers"} onChange={(event) => setTrainer(event.target.value)} options={trainerOptions} value={trainer} />
            </FilterField>
            <FilterField label="Status">
              <FilterSelect className="w-full" label={statusLabel(status)} onChange={(event) => setStatus(event.target.value)} options={statusOptions} value={status} />
            </FilterField>
            <FilterField label="Attendance date">
              <Button className="w-full justify-start gap-2" variant="secondary">
                <CalendarDays className="size-[var(--icon-sm)]" />
                23 Aug 2026
              </Button>
            </FilterField>
            <FilterField className="xl:col-start-6" label="Sort by">
              <FilterSelect className="w-full" label={sortOptions.find((option) => option.value === sort)?.label ?? "Schedule"} onChange={(event) => setSort(event.target.value)} options={sortOptions} value={sort} />
            </FilterField>
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-x-[var(--space-6)] gap-y-[var(--space-2)] text-sm text-[var(--color-text-secondary)]">
          <LegendDot className="bg-[var(--color-success)]" label="Available 0-69%" />
          <LegendDot className="bg-[var(--color-warning)]" label="Filling 70-89%" />
          <LegendDot className="bg-[var(--color-warning-strong)]" label="Nearly Full 90-99%" />
          <LegendDot className="bg-[var(--color-danger)]" label="Full 100%" />
          <LegendDot className="bg-[var(--color-danger-strong)]" label="Over Capacity 100%+" />
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)] text-xs font-bold uppercase text-[var(--color-text-muted)]">
                  <th className="px-[var(--space-4)] py-[var(--space-4)]">Program</th>
                  <th className="px-[var(--space-4)] py-[var(--space-4)]">Schedule</th>
                  <th className="px-[var(--space-4)] py-[var(--space-4)]">Trainer</th>
                  <th className="px-[var(--space-4)] py-[var(--space-4)]">Admissions</th>
                  <th className="px-[var(--space-4)] py-[var(--space-4)]">Attendance</th>
                  <th className="px-[var(--space-4)] py-[var(--space-4)]">Available</th>
                  <th className="px-[var(--space-4)] py-[var(--space-4)]">Occupancy</th>
                  <th className="px-[var(--space-4)] py-[var(--space-4)]">Status</th>
                  <th className="px-[var(--space-4)] py-[var(--space-4)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-[var(--space-4)] py-[var(--space-6)] text-center text-[var(--color-text-secondary)]" colSpan={9}>
                      Loading batches...
                    </td>
                  </tr>
                ) : visibleBatches.length ? (
                  visibleBatches.map((batch) => {
                    const occupancy = occupancyByBatch[batch.id];
                    const percent = occupancyPercent(occupancy);
                    const level = occupancyLevel(percent);
                    const available = availableSeats(occupancy, batch);
                    const admitted = Number(occupancy?.admitted ?? 0);

                    return (
                      <tr className="border-b border-[var(--color-divider)] last:border-0" key={batch.id}>
                        <td className="px-[var(--space-4)] py-[var(--space-4)]">
                          <button className="text-left" onClick={() => openDetail(batch)} type="button">
                            <p className="font-bold text-[var(--color-text)]">{programNameFor(batch.programId, programs) || "Program"}</p>
                            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{sessionLabel(sessionFor(batch.startTime))}</p>
                          </button>
                        </td>
                        <td className="px-[var(--space-4)] py-[var(--space-4)]">
                          <p className="font-semibold text-[var(--color-text)]">{formatTimeRange(batch)}</p>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{formatDays(batch.daysPattern)}</p>
                        </td>
                        <td className="px-[var(--space-4)] py-[var(--space-4)] text-[var(--color-text)]">
                          {trainerNameFor(batch.trainerId, staff) || "-"}
                        </td>
                        <td className="px-[var(--space-4)] py-[var(--space-4)]">
                          <div className="w-32">
                            <p className="font-semibold text-[var(--color-text)]">
                              {admitted} / {occupancy?.capacity ?? batch.capacity}
                            </p>
                            <OccupancyBar level={level} percent={percent} />
                          </div>
                        </td>
                        <td className="px-[var(--space-4)] py-[var(--space-4)] font-semibold text-[var(--color-text)]">
                          {Math.round(admitted * 0.7)} / {admitted}
                        </td>
                        <td className="px-[var(--space-4)] py-[var(--space-4)] font-semibold text-[var(--color-text)]">
                          {available}
                        </td>
                        <td className="px-[var(--space-4)] py-[var(--space-4)]">
                          <p className={cn("font-bold", occupancyTextClass(level))}>{percent}%</p>
                          <p className={cn("text-sm font-semibold", occupancyTextClass(level))}>{occupancyLabel(level)}</p>
                        </td>
                        <td className="px-[var(--space-4)] py-[var(--space-4)]">
                          <BatchStatusBadge status={batch.status} />
                        </td>
                        <td className="px-[var(--space-4)] py-[var(--space-4)] text-right">
                          <button
                            aria-label={`Open ${batch.name}`}
                            className="inline-grid size-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                            onClick={() => openDetail(batch)}
                            type="button"
                          >
                            <MoreVertical className="size-[var(--icon-sm)]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-[var(--space-4)] py-[var(--space-6)] text-center text-[var(--color-text-secondary)]" colSpan={9}>
                      No batches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog className="max-w-2xl" isOpen={formMode !== null} onClose={() => setFormMode(null)} title={formMode === "edit" ? "Edit Batch" : "New Batch"}>
        <BatchForm
          form={form}
          isSaving={isSaving}
          onChange={setForm}
          onSubmit={saveBatch}
          programOptions={programs.map((item) => ({ label: item.name, value: item.id }))}
          trainerOptions={formTrainerOptions}
          submitLabel={formMode === "edit" ? "Save Changes" : "Create Batch"}
        />
      </Dialog>

      <Dialog className="max-w-2xl" isOpen={detailBatch !== null} onClose={() => setDetailBatch(null)} title="Batch Details">
        {detailBatch ? (
          <div className="space-y-[var(--space-5)]">
            <div className="grid gap-[var(--space-3)] md:grid-cols-2">
              <DetailItem label="Program" value={programNameFor(detailBatch.programId, programs) || "-"} />
              <DetailItem label="Batch" value={detailBatch.name} />
              <DetailItem label="Schedule" value={formatTimeRange(detailBatch)} />
              <DetailItem label="Days" value={formatDays(detailBatch.daysPattern)} />
              <DetailItem label="Trainer" value={trainerNameFor(detailBatch.trainerId, staff) || "-"} />
              <DetailItem label="Status" value={statusLabel(detailBatch.status)} />
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-[var(--space-4)]">
              <div className="flex flex-col gap-[var(--space-3)] md:flex-row md:items-end">
                <FilterField className="flex-1" label="Assign staff">
                  <FilterSelect
                    className="w-full"
                    label={trainerNameFor(staffToAssign, staff) || "Select trainer"}
                    onChange={(event) => setStaffToAssign(event.target.value)}
                    options={formTrainerOptions}
                    value={staffToAssign}
                  />
                </FilterField>
                <Button className="gap-2" disabled={isSaving || !staffToAssign} onClick={assignStaff}>
                  <UserPlus className="size-[var(--icon-sm)]" />
                  Assign
                </Button>
              </div>

              <div className="mt-[var(--space-4)] space-y-2">
                {detailStaff.length ? (
                  detailStaff.map((assignment) => (
                    <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-[var(--space-3)] py-2" key={`${assignment.batchId}-${assignment.staffId}`}>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {assignment.staff?.fullName || trainerNameFor(assignment.staffId, staff) || "Assigned staff"}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">Trainer assignment</p>
                      </div>
                      <Button className="gap-2" disabled={isSaving} onClick={() => unassignStaff(assignment.staffId)} variant="ghost">
                        <UserMinus className="size-[var(--icon-sm)]" />
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-text-secondary)]">No staff assigned yet.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-[var(--space-3)]">
              <Button onClick={() => openEdit(detailBatch)} variant="secondary">
                Edit Batch
              </Button>
              <Button className="gap-2" onClick={() => setBatchToDelete(detailBatch)} variant="secondary">
                <Trash2 className="size-[var(--icon-sm)]" />
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog className="max-w-md" isOpen={batchToDelete !== null} onClose={() => setBatchToDelete(null)} title="Delete Batch">
        <div className="space-y-[var(--space-4)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Delete {batchToDelete?.name}? This removes the batch from the schedule.
          </p>
          <div className="flex justify-end gap-[var(--space-3)]">
            <Button disabled={isSaving} onClick={() => setBatchToDelete(null)} variant="secondary">
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}

function BatchForm({
  form,
  isSaving,
  onChange,
  onSubmit,
  programOptions,
  submitLabel,
  trainerOptions,
}: {
  form: BatchFormState;
  isSaving: boolean;
  onChange: (form: BatchFormState) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  programOptions: Array<{ label: string; value: string }>;
  submitLabel: string;
  trainerOptions: Array<{ label: string; value: string }>;
}) {
  return (
    <form className="grid gap-[var(--space-4)]" onSubmit={onSubmit}>
      <div className="grid gap-[var(--space-4)] md:grid-cols-2">
        <FilterField label="Program">
          <FilterSelect className="w-full" label={programOptions.find((option) => option.value === form.programId)?.label || "Select program"} onChange={(event) => onChange({ ...form, programId: event.target.value })} options={programOptions} required value={form.programId} />
        </FilterField>
        <Input label="Batch name" onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="Morning (6-7 AM)" required value={form.name} />
        <Input label="Start time" onChange={(event) => onChange({ ...form, startTime: event.target.value })} required type="time" value={form.startTime} />
        <Input label="End time" onChange={(event) => onChange({ ...form, endTime: event.target.value })} required type="time" value={form.endTime} />
        <Input label="Days pattern" onChange={(event) => onChange({ ...form, daysPattern: event.target.value })} placeholder="M,T,W,Th,F" required value={form.daysPattern} />
        <Input label="Capacity" min="0" onChange={(event) => onChange({ ...form, capacity: event.target.value })} required type="number" value={form.capacity} />
        <FilterField label="Trainer">
          <FilterSelect className="w-full" label={trainerOptions.find((option) => option.value === form.trainerId)?.label || "No trainer"} onChange={(event) => onChange({ ...form, trainerId: event.target.value })} options={trainerOptions} value={form.trainerId} />
        </FilterField>
        <FilterField label="Status">
          <FilterSelect className="w-full" label={statusLabel(form.status)} onChange={(event) => onChange({ ...form, status: event.target.value as BatchStatus })} options={statusOptions.filter((option) => option.value)} value={form.status} />
        </FilterField>
      </div>
      <div className="flex justify-end">
        <Button disabled={isSaving || !form.programId || !form.name.trim()} type="submit">
          {isSaving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FilterField({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-semibold text-[var(--color-text-muted)]">{label}</span>
      {children}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-[var(--space-3)] py-2">
      <p className="text-xs font-semibold text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}

function OccupancyBar({ level, percent }: { level: OccupancyLevel; percent: number }) {
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--gray-200)]">
      <div className={cn("h-full rounded-full", occupancyBackgroundClass(level))} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

function BatchStatusBadge({ status }: { status: BatchStatus }) {
  if (status === "FULL") return <StatusBadge status="lost">Full</StatusBadge>;
  if (status === "ACTIVE") return <StatusBadge status="active">Active</StatusBadge>;

  return (
    <span className="inline-flex h-[var(--badge-height)] items-center rounded-[var(--badge-radius)] bg-[var(--gray-100)] px-[var(--badge-padding-x)] text-xs font-semibold text-[var(--color-text-secondary)]">
      {statusLabel(status)}
    </span>
  );
}

type OccupancyLevel = "available" | "filling" | "nearly-full" | "full" | "over";

function occupancyPercent(occupancy?: BatchOccupancy) {
  if (!occupancy?.capacity) return 0;
  return Math.round((Number(occupancy.admitted ?? 0) / Number(occupancy.capacity)) * 100);
}

function availableSeats(occupancy: BatchOccupancy | undefined, batch: Batch) {
  return Number(occupancy?.availableSeats ?? batch.capacity);
}

function occupancyLevel(percent: number): OccupancyLevel {
  if (percent > 100) return "over";
  if (percent === 100) return "full";
  if (percent >= 90) return "nearly-full";
  if (percent >= 70) return "filling";
  return "available";
}

function occupancyLabel(level: OccupancyLevel) {
  return {
    available: "Available",
    filling: "Filling",
    "nearly-full": "Nearly Full",
    full: "Full",
    over: "Over Capacity",
  }[level];
}

function occupancyBackgroundClass(level: OccupancyLevel) {
  return {
    available: "bg-[var(--color-success)]",
    filling: "bg-[var(--color-warning)]",
    "nearly-full": "bg-[var(--color-warning-strong)]",
    full: "bg-[var(--color-danger)]",
    over: "bg-[var(--color-danger-strong)]",
  }[level];
}

function occupancyTextClass(level: OccupancyLevel) {
  return {
    available: "text-[var(--color-success)]",
    filling: "text-[var(--color-warning)]",
    "nearly-full": "text-[var(--color-warning-strong)]",
    full: "text-[var(--color-danger)]",
    over: "text-[var(--color-danger-strong)]",
  }[level];
}

function statusLabel(status: string) {
  return statusOptions.find((option) => option.value === status)?.label ?? "All statuses";
}

function sessionLabel(value: string) {
  return sessionOptions.find((option) => option.value === value)?.label ?? "All sessions";
}

function sessionFor(time: string) {
  const hour = Number(time.split(":")[0] ?? 0);
  return hour < 12 ? "MORNING" : "EVENING";
}

function programNameFor(programId: string | undefined | null, programs: Program[]) {
  return programs.find((program) => program.id === programId)?.name ?? "";
}

function trainerNameFor(trainerId: string | undefined | null, staff: Staff[]) {
  return staff.find((person) => person.id === trainerId)?.fullName ?? "";
}

function formatTimeRange(batch: Pick<Batch, "startTime" | "endTime">) {
  return `${formatTime(batch.startTime)} - ${formatTime(batch.endTime)}`;
}

function formatTime(time: string) {
  const [hourValue, minute = "00"] = time.split(":");
  const hour = Number(hourValue);
  const displayHour = hour % 12 || 12;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${displayHour}:${minute} ${suffix}`;
}

function toTimeInput(time: string) {
  return time.slice(0, 5);
}

function normalizeTime(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}

function formatDays(pattern: string) {
  return pattern
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean)
    .map((day) => {
      return {
        M: "Mon",
        T: "Tue",
        W: "Wed",
        Th: "Thu",
        F: "Fri",
        Sa: "Sat",
        Su: "Sun",
      }[day] ?? day;
    })
    .join(", ");
}
