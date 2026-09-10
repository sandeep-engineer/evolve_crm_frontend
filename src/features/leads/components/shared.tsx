import type React from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeadPhoneConflictError, PaginationMeta } from "@/lib/api/leads";
import { cn } from "@/lib/utils";
import { formatEnum, isEmptyValue } from "../utils/lead-formatters";

export function VisitDetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-bold uppercase text-[var(--color-text-muted)]">{label}</dt>
      <dd className="break-words text-sm text-[var(--color-text-secondary)]">{isEmptyValue(value) ? "Not set" : value}</dd>
    </div>
  );
}

export function DetailSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <h3 className="text-sm font-bold text-[var(--color-text)]">{title}</h3>
      <dl className="mt-3 grid gap-3">{children}</dl>
    </section>
  );
}

export function DetailItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-bold uppercase text-[var(--color-text-muted)]">{label}</dt>
      <dd className="break-words text-sm text-[var(--color-text)]">{isEmptyValue(value) ? "Not set" : value}</dd>
    </div>
  );
}

export function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] p-6">
      <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-secondary)]">
        <Loader2 className="size-[var(--icon-md)] animate-spin text-[var(--color-primary)]" />
        {label}
      </div>
    </div>
  );
}

export function EmptyPanel({
  actionLabel,
  message,
  onAction,
  tone = "neutral",
}: {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  tone?: "danger" | "neutral";
}) {
  return (
    <div className="grid min-h-56 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] p-6 text-center">
      <div>
        <p className={cn("text-sm font-semibold", tone === "danger" ? "text-[var(--color-danger)]" : "text-[var(--color-text-secondary)]")}>
          {message}
        </p>
        {onAction ? (
          <Button className="mt-4" onClick={onAction} variant="secondary">
            {actionLabel ?? "Retry"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const start = meta.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const end = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--color-divider)] px-[var(--space-5)] py-[var(--space-4)] text-sm text-[var(--color-text-secondary)] md:flex-row md:items-center md:justify-between">
      <span>
        Showing {start}-{end} of {meta.total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Previous page"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(Math.max(1, meta.page - 1))}
          variant="secondary"
        >
          <ChevronLeft className="size-[var(--icon-sm)]" />
        </Button>
        <span className="min-w-24 text-center font-semibold text-[var(--color-text)]">
          Page {meta.page} of {Math.max(1, meta.totalPages)}
        </span>
        <Button
          aria-label="Next page"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(Math.min(meta.totalPages, meta.page + 1))}
          variant="secondary"
        >
          <ChevronRight className="size-[var(--icon-sm)]" />
        </Button>
      </div>
    </div>
  );
}

export function Alert({
  children,
  onDismiss,
  tone,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
  tone: "danger" | "success" | "warning";
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        tone === "success" &&
          "border-[var(--color-success)] bg-[var(--green-50)] text-[var(--color-success)]",
        tone === "danger" &&
          "border-[var(--color-danger)] bg-[var(--red-50)] text-[var(--color-danger)]",
        tone === "warning" &&
          "border-[var(--yellow-300)] bg-[var(--yellow-50)] text-[var(--yellow-800)]",
      )}
    >
      <Icon className="mt-0.5 size-[var(--icon-sm)] shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      <button className="font-bold" onClick={onDismiss} type="button">
        Dismiss
      </button>
    </div>
  );
}

export function ConflictPanel({
  conflict,
  onLocate,
}: {
  conflict: LeadPhoneConflictError;
  onLocate: () => void;
}) {
  const existingLead = conflict.existingLead;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--red-50)] p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-[var(--icon-sm)] text-[var(--color-danger)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--color-danger)]">
            Duplicate phone found
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {conflict.message}
          </p>
          {existingLead ? (
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              Existing Lead: {existingLead.fullName} | {existingLead.primaryPhone} | {formatEnum(existingLead.stage)} | {formatEnum(existingLead.status)}
            </p>
          ) : null}
        </div>
        <Button onClick={onLocate} type="button" variant="secondary">
          Show in list
        </Button>
      </div>
    </div>
  );
}

export function ScopeValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
      <span>{label}</span>
      <div className="flex h-[var(--control-height-lg)] items-center rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-[var(--control-padding-x)] text-sm text-[var(--color-text-secondary)]">
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}
