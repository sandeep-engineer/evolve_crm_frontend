import type { ComponentType } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "blue" | "green" | "violet" | "amber" | "red" | "cyan";

type StatCardProps = {
  title: string;
  value: string | number;
  note: string;
  tone: StatTone;
  icon: ComponentType<{ className?: string }>;
  wide?: boolean;
};

const toneClassNames: Record<StatTone, string> = {
  blue: "bg-[var(--blue-50)] text-[var(--color-primary)]",
  green: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  violet: "bg-[var(--color-trial-surface)] text-[var(--color-trial)]",
  amber: "bg-[var(--color-warning-surface)] text-[var(--color-warning)]",
  red: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
  cyan: "bg-[var(--cyan-50)] text-[var(--cyan-600)]",
};

export function StatCard({
  title,
  value,
  note,
  tone,
  icon: Icon,
  wide = false,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "flex min-h-[var(--kpi-min-height)] items-center gap-[var(--space-4)] p-[var(--card-padding)]",
        wide && "md:col-span-2",
      )}
    >
      <div
        className={cn(
          "grid size-14 shrink-0 place-items-center rounded-[var(--radius-full)]",
          toneClassNames[tone],
        )}
      >
        <Icon className="size-[var(--icon-lg)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase leading-[var(--leading-snug)] text-[var(--color-text-muted)]">
          {title}
        </p>
        <p className="mt-1 text-[length:var(--kpi-value-size)] font-bold leading-tight text-[var(--color-text)]">
          {value}
        </p>
        <p className="mt-3 text-xs font-medium text-[var(--color-text-secondary)]">
          {note}
        </p>
      </div>
    </Card>
  );
}
