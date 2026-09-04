"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreVertical, Plus, Search, Settings } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AuthUser } from "@/lib/api/auth";
import { getMemberships, type Membership } from "@/lib/api/memberships";
import {
  createPlanCategory,
  deletePlanCategory,
  getPlanCategory,
  getPlanCategories,
  updatePlanCategory,
  type PlanCategory,
} from "@/lib/api/plan-categories";
import {
  createPlan,
  deletePlan,
  getPlan,
  getPlans,
  updatePlan,
  type CreatePlanPayload,
  type Plan,
} from "@/lib/api/plans";
import {
  createProgram,
  deleteProgram,
  getProgram,
  getPrograms,
  updateProgram,
  type Program,
} from "@/lib/api/programs";
import { getAccessToken, getStoredUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type CategoryFilter = "ALL" | string;
type PlanGroup = "WEEKDAY PLANS" | "WEEKEND PLANS" | "CUSTOMIZED PLANS";
type PlanFormState = {
  categoryId: string;
  daysPattern: string;
  discountPercent: string;
  durationDays: string;
  name: string;
  price: string;
  pricePerDay: string;
  pricingType: "DURATION_BASED" | "SESSION_BASED";
  sessionsCount: string;
  status: "ACTIVE" | "INACTIVE";
};

const emptyPlanForm: PlanFormState = {
  categoryId: "",
  daysPattern: "M,T,W,Th,F",
  discountPercent: "0",
  durationDays: "30",
  name: "",
  price: "",
  pricePerDay: "",
  pricingType: "DURATION_BASED",
  sessionsCount: "",
  status: "ACTIVE",
};

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const durationOptions = [
  { label: "Any duration", value: "" },
  { label: "Up to 30 days", value: "SHORT" },
  { label: "31-90 days", value: "MEDIUM" },
  { label: "90+ days", value: "LONG" },
];

export function PlansScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<PlanCategory[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeProgramId, setActiveProgramId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [duration, setDuration] = useState("");
  const [sort, setSort] = useState("DURATION");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [planDialogMode, setPlanDialogMode] = useState<"create" | "edit" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(emptyPlanForm);
  const [programName, setProgramName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showManagePrograms, setShowManagePrograms] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [programToEdit, setProgramToEdit] = useState<Program | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<PlanCategory | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<PlanCategory | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null);

  const loadData = useCallback(async (accessToken = token) => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const [programData, categoryData, planData, membershipData] = await Promise.all([
        getPrograms(accessToken),
        getPlanCategories(accessToken),
        getPlans(accessToken),
        getMemberships(accessToken),
      ]);
      setPrograms(programData);
      setCategories(categoryData);
      setPlans(planData);
      setMemberships(membershipData);
      setActiveProgramId((current) => current || programData[0]?.id || "");
      setError("");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to load plans.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    setToken(accessToken);
    setUser(getStoredUser());
    loadData(accessToken);
  }, [loadData]);

  const categoriesForProgram = useMemo(() => {
    return categories.filter((category) => category.programId === activeProgramId);
  }, [activeProgramId, categories]);

  const activeMemberCountByPlanId = useMemo(() => {
    return memberships.reduce<Record<string, number>>((acc, membership) => {
      if (membership.status === "ACTIVE") {
        acc[membership.planId] = (acc[membership.planId] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [memberships]);

  const visiblePlans = useMemo(() => {
    const categoryIds = new Set(categoriesForProgram.map((category) => category.id));
    const query = search.trim().toLowerCase();

    return plans
      .filter((plan) => {
        const planDuration = Number(plan.durationDays ?? 0);
        const matchesProgram = categoryIds.has(plan.categoryId);
        const matchesCategory = categoryFilter === "ALL" || plan.categoryId === categoryFilter;
        const matchesSearch = query ? plan.name.toLowerCase().includes(query) : true;
        const matchesStatus = status ? plan.status === status : true;
        const matchesDuration =
          duration === "SHORT"
            ? planDuration <= 30
            : duration === "MEDIUM"
              ? planDuration > 30 && planDuration <= 90
              : duration === "LONG"
                ? planDuration > 90
                : true;

        return matchesProgram && matchesCategory && matchesSearch && matchesStatus && matchesDuration;
      })
      .sort((a, b) => {
        if (sort === "PRICE") return Number(a.price) - Number(b.price);
        if (sort === "MEMBERS") {
          return (activeMemberCountByPlanId[b.id] ?? 0) - (activeMemberCountByPlanId[a.id] ?? 0);
        }
        return Number(a.durationDays ?? 0) - Number(b.durationDays ?? 0);
      });
  }, [activeMemberCountByPlanId, categoriesForProgram, categoryFilter, duration, plans, search, sort, status]);

  const openCreatePlan = () => {
    setSelectedPlan(null);
    setPlanForm({
      ...emptyPlanForm,
      categoryId: categoryFilter !== "ALL" ? categoryFilter : categoriesForProgram[0]?.id ?? "",
    });
    setPlanDialogMode("create");
  };

  const openEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPlanForm({
      categoryId: plan.categoryId,
      daysPattern: plan.daysPattern ?? "",
      discountPercent: String(plan.discountPercent ?? 0),
      durationDays: String(plan.durationDays ?? ""),
      name: plan.name,
      price: String(plan.price),
      pricePerDay: String(plan.pricePerDay ?? ""),
      pricingType: plan.pricingType,
      sessionsCount: String(plan.sessionsCount ?? ""),
      status: plan.status,
    });
    setPlanDialogMode("edit");
  };

  const openPlanDetail = async (plan: Plan) => {
    if (!token) return;

    setDetailPlan(plan);
    try {
      const freshPlan = await getPlan(token, plan.id);
      setDetailPlan(freshPlan);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to load plan details.");
    }
  };

  const savePlan = async () => {
    if (!token) return;

    setIsSaving(true);
    setNotice("");
    try {
      const payload = cleanPlanPayload(planForm);
      if (planDialogMode === "edit" && selectedPlan) {
        await updatePlan(token, selectedPlan.id, payload);
        setNotice("Plan updated.");
      } else {
        await createPlan(token, payload);
        setNotice("Plan created.");
      }
      setPlanDialogMode(null);
      await loadData();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to save plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveProgram = async () => {
    if (!token || !programName.trim()) return;

    setIsSaving(true);
    setNotice("");
    try {
      const program = programToEdit
        ? await updateProgram(token, programToEdit.id, { name: programName.trim() })
        : await createProgram(token, {
            description: "Created from Plans Handling.",
            isActive: true,
            name: programName.trim(),
          });
      setProgramName("");
      setProgramToEdit(null);
      setShowProgramDialog(false);
      await loadData();
      setActiveProgramId(program.id);
      setNotice(programToEdit ? "Program updated." : "Program created.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to save program.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveCategory = async () => {
    if (!token || !categoryName.trim() || !activeProgramId) return;

    setIsSaving(true);
    setNotice("");
    try {
      const category = categoryToEdit
        ? await updatePlanCategory(token, categoryToEdit.id, { name: categoryName.trim() })
        : await createPlanCategory(token, {
            name: categoryName.trim(),
            programId: activeProgramId,
          });
      setCategoryName("");
      setCategoryToEdit(null);
      setShowCategoryDialog(false);
      setCategoryFilter(category.id);
      await loadData();
      setNotice(categoryToEdit ? "Category updated." : "Category created.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to save category.");
    } finally {
      setIsSaving(false);
    }
  };

  const editProgram = async (program: Program) => {
    if (!token) return;

    try {
      const freshProgram = await getProgram(token, program.id);
      setProgramToEdit(freshProgram);
      setProgramName(freshProgram.name);
      setShowProgramDialog(true);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to load program.");
    }
  };

  const editCategory = async (category: PlanCategory) => {
    if (!token) return;

    try {
      const freshCategory = await getPlanCategory(token, category.id);
      setCategoryToEdit(freshCategory);
      setCategoryName(freshCategory.name);
      setShowCategoryDialog(true);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to load category.");
    }
  };

  const removeProgram = async () => {
    if (!token || !programToDelete) return;

    setIsSaving(true);
    setNotice("");
    try {
      await deleteProgram(token, programToDelete.id);
      setProgramToDelete(null);
      if (activeProgramId === programToDelete.id) setActiveProgramId("");
      await loadData();
      setNotice("Program deleted.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to delete program.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeCategory = async () => {
    if (!token || !categoryToDelete) return;

    setIsSaving(true);
    setNotice("");
    try {
      await deletePlanCategory(token, categoryToDelete.id);
      setCategoryToDelete(null);
      if (categoryFilter === categoryToDelete.id) setCategoryFilter("ALL");
      await loadData();
      setNotice("Category deleted.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to delete category.");
    } finally {
      setIsSaving(false);
    }
  };

  const removePlan = async () => {
    if (!token || !planToDelete) return;

    setIsSaving(true);
    setNotice("");
    try {
      await deletePlan(token, planToDelete.id);
      setPlanToDelete(null);
      await loadData();
      setNotice("Plan deleted.");
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to delete plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const activeProgramName = programs.find((program) => program.id === activeProgramId)?.name ?? "Program";

  return (
    <AppShell user={user}>
      <div className="grid gap-[var(--section-gap)]">
        <div className="flex flex-col gap-[var(--space-4)] border-b border-[var(--color-divider)] pb-[var(--space-5)] md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-[var(--color-text)]">
              Plans Handling
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Manage program-wise membership plans, pricing and duration.
            </p>
          </div>
          <Button className="gap-2" onClick={openCreatePlan}>
            <Plus className="size-[var(--icon-sm)]" />
            New Plan
          </Button>
        </div>

        <div className="flex flex-col gap-[var(--space-3)] border-b border-[var(--color-divider)] pb-[var(--space-2)] xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-h-11 gap-[var(--space-5)] overflow-x-auto">
            {programs.map((item) => (
              <button
                className={cn(
                  "shrink-0 border-b-2 border-transparent px-1 text-sm font-semibold text-[var(--color-text)]",
                  item.id === activeProgramId && "border-[var(--color-primary)] text-[var(--color-primary)]",
                )}
                key={item.id}
                onClick={() => {
                  setActiveProgramId(item.id);
                  setCategoryFilter("ALL");
                }}
                type="button"
              >
                {cleanSeedName(item.name)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-[var(--space-3)]">
            <Button
              className="gap-2"
              onClick={() => {
                setProgramToEdit(null);
                setProgramName("");
                setShowProgramDialog(true);
              }}
              variant="secondary"
            >
              <Plus className="size-[var(--icon-sm)]" />
              Add Program
            </Button>
            <Button className="gap-2" onClick={() => setShowManagePrograms(true)} variant="secondary">
              <Settings className="size-[var(--icon-sm)]" />
              Manage Programs
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-[var(--space-3)] border-b border-[var(--color-divider)] pb-[var(--space-4)] xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-[var(--space-3)]">
            <CategoryButton
              active={categoryFilter === "ALL"}
              label="All Plans"
              onClick={() => setCategoryFilter("ALL")}
            />
            {categoriesForProgram.map((item) => (
              <CategoryButton
                active={item.id === categoryFilter}
                key={item.id}
                label={cleanSeedName(item.name)}
                onClick={() => setCategoryFilter(item.id)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-[var(--space-3)]">
            <Button
              className="gap-2"
              disabled={!activeProgramId}
              onClick={() => {
                setCategoryToEdit(null);
                setCategoryName("");
                setShowCategoryDialog(true);
              }}
              variant="secondary"
            >
              <Plus className="size-[var(--icon-sm)]" />
              Add Category
            </Button>
            <Button className="gap-2" disabled={!activeProgramId} onClick={() => setShowManageCategories(true)} variant="secondary">
              <Settings className="size-[var(--icon-sm)]" />
              Manage Categories
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-[var(--space-3)] md:flex-row md:items-center">
          <label className="relative h-[var(--control-height-md)] min-w-[18rem] flex-1 md:max-w-[22rem]">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              className="h-full w-full rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-11 pr-[var(--control-padding-x)] text-sm shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search plans by name"
              type="search"
              value={search}
            />
          </label>
          <FilterSelect
            active={Boolean(status)}
            label={status ? formatStatus(status) : "All statuses"}
            onChange={(event) => setStatus(event.target.value)}
            options={statusOptions}
            value={status}
          />
          <FilterSelect
            active={Boolean(duration)}
            label={durationOptions.find((option) => option.value === duration)?.label ?? "Any duration"}
            onChange={(event) => setDuration(event.target.value)}
            options={durationOptions}
            value={duration}
          />
          <span className="text-sm font-medium text-[var(--color-text-muted)]">
            {isLoading ? "Loading plans..." : `${visiblePlans.length} plans`}
          </span>
          <div className="ml-auto flex items-center gap-[var(--space-3)]">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Sort by</span>
            <FilterSelect
              label={sort === "PRICE" ? "Price" : sort === "MEMBERS" ? "Active members" : "Duration"}
              onChange={(event) => setSort(event.target.value)}
              options={[
                { label: "Duration", value: "DURATION" },
                { label: "Price", value: "PRICE" },
                { label: "Active members", value: "MEMBERS" },
              ]}
              value={sort}
            />
          </div>
        </div>

        {notice ? (
          <Card className="border-[var(--color-success-border)] bg-[var(--color-success-surface)] p-[var(--space-4)] text-sm font-medium text-[var(--color-success)]">
            {notice}
          </Card>
        ) : null}

        {error ? (
          <Card className="border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-[var(--space-4)] text-sm font-medium text-[var(--color-danger)]">
            {error}
          </Card>
        ) : null}

        <PlansTable
          activeMemberCountByPlanId={activeMemberCountByPlanId}
          categories={categories}
          isLoading={isLoading}
          onDelete={setPlanToDelete}
          onEdit={openEditPlan}
          onOpen={openPlanDetail}
          plans={visiblePlans}
        />
      </div>

      <PlanFormDialog
        categories={categoriesForProgram}
        form={planForm}
        isOpen={planDialogMode !== null}
        isSaving={isSaving}
        mode={planDialogMode ?? "create"}
        onChange={setPlanForm}
        onClose={() => setPlanDialogMode(null)}
        onSave={savePlan}
      />

      <NameDialog
        isOpen={showProgramDialog}
        isSaving={isSaving}
        onChange={setProgramName}
        onClose={() => {
          setProgramToEdit(null);
          setShowProgramDialog(false);
        }}
        onSave={saveProgram}
        title={programToEdit ? "Edit Program" : "Add Program"}
        value={programName}
      />

      <NameDialog
        helper={`Program: ${cleanSeedName(activeProgramName)}`}
        isOpen={showCategoryDialog}
        isSaving={isSaving}
        onChange={setCategoryName}
        onClose={() => {
          setCategoryToEdit(null);
          setShowCategoryDialog(false);
        }}
        onSave={saveCategory}
        title={categoryToEdit ? "Edit Category" : "Add Category"}
        value={categoryName}
      />

      <ManageProgramsDialog
        isOpen={showManagePrograms}
        onClose={() => setShowManagePrograms(false)}
        onDelete={setProgramToDelete}
        onEdit={editProgram}
        programs={programs}
      />

      <ManageCategoriesDialog
        categories={categoriesForProgram}
        isOpen={showManageCategories}
        onClose={() => setShowManageCategories(false)}
        onDelete={setCategoryToDelete}
        onEdit={editCategory}
      />

      <PlanDetailDialog
        activeMembers={detailPlan ? activeMemberCountByPlanId[detailPlan.id] ?? 0 : 0}
        category={detailPlan ? categories.find((category) => category.id === detailPlan.categoryId) : undefined}
        isOpen={Boolean(detailPlan)}
        onClose={() => setDetailPlan(null)}
        onEdit={(plan) => {
          setDetailPlan(null);
          openEditPlan(plan);
        }}
        plan={detailPlan}
      />

      <ConfirmDialog
        isOpen={Boolean(planToDelete)}
        isSaving={isSaving}
        message={`Delete ${planToDelete?.name ?? "this plan"}?`}
        onClose={() => setPlanToDelete(null)}
        onConfirm={removePlan}
        title="Delete Plan"
      />

      <ConfirmDialog
        isOpen={Boolean(programToDelete)}
        isSaving={isSaving}
        message={`Delete ${programToDelete?.name ?? "this program"}? Related categories and plans may also be affected.`}
        onClose={() => setProgramToDelete(null)}
        onConfirm={removeProgram}
        title="Delete Program"
      />

      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        isSaving={isSaving}
        message={`Delete ${categoryToDelete?.name ?? "this category"}? Related plans may also be affected.`}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={removeCategory}
        title="Delete Category"
      />
    </AppShell>
  );
}

function CategoryButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "h-[var(--control-height-md)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm font-semibold text-[var(--color-text)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-surface-hover)]",
        active &&
          "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)]",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function PlansTable({
  activeMemberCountByPlanId,
  categories,
  isLoading,
  onDelete,
  onEdit,
  onOpen,
  plans,
}: {
  activeMemberCountByPlanId: Record<string, number>;
  categories: PlanCategory[];
  isLoading: boolean;
  onDelete: (plan: Plan) => void;
  onEdit: (plan: Plan) => void;
  onOpen: (plan: Plan) => void;
  plans: Plan[];
}) {
  const groups: PlanGroup[] = ["WEEKDAY PLANS", "WEEKEND PLANS", "CUSTOMIZED PLANS"];

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[74rem] border-collapse text-left text-sm">
          <thead className="h-[var(--table-header-height)] bg-[var(--table-header-background)] text-xs font-bold text-[var(--color-text)]">
            <tr>
              {["Plan", "Duration", "Schedule", "Price", "Price / day", "Discount", "Active members", "Status", "Actions"].map((heading) => (
                <th className="px-[var(--table-cell-padding-x)]" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-divider)]">
            {isLoading ? (
              <tr>
                <td className="h-32 text-center text-[var(--color-text-muted)]" colSpan={9}>
                  Loading plans...
                </td>
              </tr>
            ) : plans.length === 0 ? (
              <tr>
                <td className="h-32 text-center text-[var(--color-text-muted)]" colSpan={9}>
                  No plans match the current filters.
                </td>
              </tr>
            ) : (
              groups.map((group) => {
                const groupPlans = plans.filter((plan) => planGroup(plan, categories) === group);
                if (groupPlans.length === 0) return null;
                return (
                  <PlanGroupRows
                    activeMemberCountByPlanId={activeMemberCountByPlanId}
                    group={group}
                    key={group}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onOpen={onOpen}
                    plans={groupPlans}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PlanGroupRows({
  activeMemberCountByPlanId,
  group,
  onDelete,
  onEdit,
  onOpen,
  plans,
}: {
  activeMemberCountByPlanId: Record<string, number>;
  group: PlanGroup;
  onDelete: (plan: Plan) => void;
  onEdit: (plan: Plan) => void;
  onOpen: (plan: Plan) => void;
  plans: Plan[];
}) {
  return (
    <>
      <tr className="h-11 bg-[var(--color-surface-muted)] text-xs font-bold uppercase text-[var(--color-text)]">
        <td className="px-[var(--table-cell-padding-x)]" colSpan={9}>
          <div className="flex items-center gap-2">
            <span className="grid size-5 place-items-center text-[var(--color-text-secondary)]">⌄</span>
            {group}
            <span className="rounded-[var(--radius-full)] bg-[var(--gray-200)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
              {plans.length}
            </span>
          </div>
        </td>
      </tr>
      {plans.map((plan) => {
        const duration = plan.pricingType === "SESSION_BASED"
          ? `${plan.sessionsCount ?? 0} sessions`
          : `${plan.durationDays ?? 0} days`;
        return (
          <tr className="h-[var(--table-row-height)] hover:bg-[var(--table-row-hover)]" key={plan.id}>
            <td className="px-[var(--table-cell-padding-x)]">
              <button
                className="text-left text-base font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]"
                onClick={() => onOpen(plan)}
                type="button"
              >
                {cleanSeedName(plan.name)}
              </button>
            </td>
            <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text-secondary)]">{duration}</td>
            <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text-secondary)]">{plan.daysPattern || "Flexible"}</td>
            <td className="px-[var(--table-cell-padding-x)] font-bold text-[var(--color-text)]">{formatCurrency(Number(plan.price))}</td>
            <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text-secondary)]">{plan.pricePerDay ? `${formatCurrency(Number(plan.pricePerDay))}/day` : "—"}</td>
            <td className={cn(
              "px-[var(--table-cell-padding-x)]",
              Number(plan.discountPercent ?? 0) ? "font-semibold text-[var(--color-success)]" : "text-[var(--color-text-muted)]",
            )}>
              {Number(plan.discountPercent ?? 0) ? `${plan.discountPercent}%` : "—"}
            </td>
            <td className="px-[var(--table-cell-padding-x)] text-[var(--color-text-secondary)]">{activeMemberCountByPlanId[plan.id] ?? 0}</td>
            <td className="px-[var(--table-cell-padding-x)]">
              <StatusBadge status={plan.status === "ACTIVE" ? "active" : "lost"}>
                {formatStatus(plan.status)}
              </StatusBadge>
            </td>
            <td className="px-[var(--table-cell-padding-x)]">
              <div className="flex items-center gap-2">
                <button
                  aria-label={`Edit ${plan.name}`}
                  className="grid size-10 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-surface-hover)]"
                  onClick={() => onEdit(plan)}
                  type="button"
                >
                  <MoreVertical className="size-[var(--icon-sm)]" />
                </button>
                <button
                  className="rounded-[var(--radius-md)] px-2 py-1 text-xs font-bold text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)]"
                  onClick={() => onDelete(plan)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

function PlanFormDialog({
  categories,
  form,
  isOpen,
  isSaving,
  mode,
  onChange,
  onClose,
  onSave,
}: {
  categories: PlanCategory[];
  form: PlanFormState;
  isOpen: boolean;
  isSaving: boolean;
  mode: "create" | "edit";
  onChange: (form: PlanFormState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog className="max-w-3xl" isOpen={isOpen} onClose={onClose} title={mode === "create" ? "New Plan" : "Edit Plan"}>
      <div className="grid gap-[var(--space-4)] md:grid-cols-2">
        <Field label="Plan name">
          <Input onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="Monthly" value={form.name} />
        </Field>
        <Field label="Category">
          <Select
            onChange={(value) => onChange({ ...form, categoryId: value })}
            options={categories.map((category) => ({ label: cleanSeedName(category.name), value: category.id }))}
            value={form.categoryId}
          />
        </Field>
        <Field label="Pricing type">
          <Select
            onChange={(value) => onChange({ ...form, pricingType: value as PlanFormState["pricingType"] })}
            options={[
              { label: "Duration Based", value: "DURATION_BASED" },
              { label: "Session Based", value: "SESSION_BASED" },
            ]}
            value={form.pricingType}
          />
        </Field>
        <Field label={form.pricingType === "SESSION_BASED" ? "Sessions" : "Duration days"}>
          <Input
            onChange={(event) =>
              onChange(
                form.pricingType === "SESSION_BASED"
                  ? { ...form, sessionsCount: event.target.value }
                  : { ...form, durationDays: event.target.value },
              )
            }
            type="number"
            value={form.pricingType === "SESSION_BASED" ? form.sessionsCount : form.durationDays}
          />
        </Field>
        <Field label="Schedule">
          <Input onChange={(event) => onChange({ ...form, daysPattern: event.target.value })} placeholder="M,T,W,Th,F" value={form.daysPattern} />
        </Field>
        <Field label="Price">
          <Input onChange={(event) => onChange({ ...form, price: event.target.value })} placeholder="6000" type="number" value={form.price} />
        </Field>
        <Field label="Price / day">
          <Input onChange={(event) => onChange({ ...form, pricePerDay: event.target.value })} placeholder="286" type="number" value={form.pricePerDay} />
        </Field>
        <Field label="Discount %">
          <Input onChange={(event) => onChange({ ...form, discountPercent: event.target.value })} type="number" value={form.discountPercent} />
        </Field>
        <Field label="Status">
          <Select
            onChange={(value) => onChange({ ...form, status: value as PlanFormState["status"] })}
            options={[
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ]}
            value={form.status}
          />
        </Field>
        <div className="flex justify-end gap-[var(--space-3)] md:col-span-2">
          <Button onClick={onClose} type="button" variant="secondary">Cancel</Button>
          <Button disabled={isSaving || !form.name || !form.categoryId || !form.price} onClick={onSave} type="button">
            {isSaving ? "Saving..." : "Save Plan"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function NameDialog({
  helper,
  isOpen,
  isSaving,
  onChange,
  onClose,
  onSave,
  title,
  value,
}: {
  helper?: string;
  isOpen: boolean;
  isSaving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  title: string;
  value: string;
}) {
  return (
    <Dialog className="max-w-md" isOpen={isOpen} onClose={onClose} title={title}>
      <div className="grid gap-[var(--space-4)]">
        {helper ? <p className="text-sm text-[var(--color-text-muted)]">{helper}</p> : null}
        <Input onChange={(event) => onChange(event.target.value)} placeholder={title} value={value} />
        <div className="flex justify-end gap-[var(--space-3)]">
          <Button onClick={onClose} type="button" variant="secondary">Cancel</Button>
          <Button disabled={isSaving || !value.trim()} onClick={onSave} type="button">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function ManageProgramsDialog({
  isOpen,
  onClose,
  onDelete,
  onEdit,
  programs,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (program: Program) => void;
  onEdit: (program: Program) => void;
  programs: Program[];
}) {
  return (
    <Dialog className="max-w-2xl" isOpen={isOpen} onClose={onClose} title="Manage Programs">
      <div className="divide-y divide-[var(--color-divider)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
        {programs.length === 0 ? (
          <p className="p-[var(--space-4)] text-sm text-[var(--color-text-muted)]">No programs found.</p>
        ) : (
          programs.map((program) => (
            <div className="flex items-center justify-between gap-[var(--space-4)] p-[var(--space-3)]" key={program.id}>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--color-text)]">{cleanSeedName(program.name)}</p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">{program.description || "No description"}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button onClick={() => onEdit(program)} type="button" variant="secondary">Edit</Button>
                <Button onClick={() => onDelete(program)} type="button" variant="secondary">Delete</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Dialog>
  );
}

function ManageCategoriesDialog({
  categories,
  isOpen,
  onClose,
  onDelete,
  onEdit,
}: {
  categories: PlanCategory[];
  isOpen: boolean;
  onClose: () => void;
  onDelete: (category: PlanCategory) => void;
  onEdit: (category: PlanCategory) => void;
}) {
  return (
    <Dialog className="max-w-2xl" isOpen={isOpen} onClose={onClose} title="Manage Categories">
      <div className="divide-y divide-[var(--color-divider)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
        {categories.length === 0 ? (
          <p className="p-[var(--space-4)] text-sm text-[var(--color-text-muted)]">No categories found for this program.</p>
        ) : (
          categories.map((category) => (
            <div className="flex items-center justify-between gap-[var(--space-4)] p-[var(--space-3)]" key={category.id}>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--color-text)]">{cleanSeedName(category.name)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Created {formatDate(category.createdAt)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button onClick={() => onEdit(category)} type="button" variant="secondary">Edit</Button>
                <Button onClick={() => onDelete(category)} type="button" variant="secondary">Delete</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Dialog>
  );
}

function PlanDetailDialog({
  activeMembers,
  category,
  isOpen,
  onClose,
  onEdit,
  plan,
}: {
  activeMembers: number;
  category?: PlanCategory;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (plan: Plan) => void;
  plan: Plan | null;
}) {
  if (!plan) return null;

  return (
    <Dialog className="max-w-2xl" isOpen={isOpen} onClose={onClose} title={cleanSeedName(plan.name)}>
      <div className="grid gap-[var(--space-4)]">
        <Card className="grid gap-3 p-[var(--space-4)] text-sm">
          <DetailRow label="Category" value={category ? cleanSeedName(category.name) : "—"} />
          <DetailRow label="Pricing type" value={formatEnum(plan.pricingType)} />
          <DetailRow label="Duration" value={plan.pricingType === "SESSION_BASED" ? `${plan.sessionsCount ?? 0} sessions` : `${plan.durationDays ?? 0} days`} />
          <DetailRow label="Schedule" value={plan.daysPattern || "Flexible"} />
          <DetailRow label="Price" value={formatCurrency(Number(plan.price))} />
          <DetailRow label="Price / day" value={plan.pricePerDay ? `${formatCurrency(Number(plan.pricePerDay))}/day` : "—"} />
          <DetailRow label="Discount" value={Number(plan.discountPercent ?? 0) ? `${plan.discountPercent}%` : "—"} />
          <DetailRow label="Active members" value={String(activeMembers)} />
          <DetailRow label="Status" value={formatStatus(plan.status)} />
          <DetailRow label="Created" value={formatDate(plan.createdAt)} />
        </Card>
        <div className="flex justify-end gap-[var(--space-3)]">
          <Button onClick={onClose} type="button" variant="secondary">Close</Button>
          <Button onClick={() => onEdit(plan)} type="button">Edit Plan</Button>
        </div>
      </div>
    </Dialog>
  );
}

function ConfirmDialog({
  isOpen,
  isSaving,
  message,
  onClose,
  onConfirm,
  title,
}: {
  isOpen: boolean;
  isSaving: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <Dialog className="max-w-md" isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      <div className="mt-[var(--space-5)] flex justify-end gap-[var(--space-3)]">
        <Button onClick={onClose} type="button" variant="secondary">Cancel</Button>
        <Button disabled={isSaving} onClick={onConfirm} type="button">
          {isSaving ? "Working..." : "Confirm"}
        </Button>
      </div>
    </Dialog>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
      {label}
      {children}
    </label>
  );
}

function Select({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value?: string;
}) {
  return (
    <select
      className="h-[var(--control-height-md)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm outline-none"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3">
      <span className="font-semibold text-[var(--color-text-muted)]">{label}</span>
      <span className="text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function cleanPlanPayload(form: PlanFormState): CreatePlanPayload {
  const payload: CreatePlanPayload = {
    categoryId: form.categoryId,
    daysPattern: form.daysPattern || undefined,
    discountPercent: Number(form.discountPercent || 0),
    name: form.name,
    price: Number(form.price),
    pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : undefined,
    pricingType: form.pricingType,
    status: form.status,
  };

  if (form.pricingType === "SESSION_BASED") {
    payload.sessionsCount = Number(form.sessionsCount || 0);
  } else {
    payload.durationDays = Number(form.durationDays || 0);
  }

  return payload;
}

function planGroup(plan: Plan, categories: PlanCategory[]): PlanGroup {
  const category = categories.find((item) => item.id === plan.categoryId);
  const categoryName = category?.name.toLowerCase() ?? "";
  if (categoryName.includes("weekend")) return "WEEKEND PLANS";
  if (categoryName.includes("custom")) return "CUSTOMIZED PLANS";
  return "WEEKDAY PLANS";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatStatus(status: string) {
  return status[0] + status.slice(1).toLowerCase();
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function cleanSeedName(name: string) {
  return name.replace(/\s+(Seed|Lead Seed)\s+\d+$/i, "");
}
