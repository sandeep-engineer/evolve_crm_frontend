"use client";

import type { ComponentType, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterSelectOption = {
  label: string;
  value: string;
};

type FilterSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  active?: boolean;
  icon?: ComponentType<{ className?: string }>;
  label: string;
  options: FilterSelectOption[];
};

export function FilterSelect({
  active,
  className,
  icon: Icon,
  label,
  options,
  ...props
}: FilterSelectProps) {
  return (
    <label
      className={cn(
        "relative inline-flex h-[var(--control-height-md)] min-w-36 items-center gap-2 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm font-semibold text-[var(--color-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-surface-hover)]",
        active && "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
        className,
      )}
    >
      {Icon ? <Icon className="size-[var(--icon-sm)] text-[var(--color-text-secondary)]" /> : null}
      <span className="pointer-events-none max-w-36 truncate">{label}</span>
      <ChevronDown className="pointer-events-none ml-auto size-[var(--icon-sm)] text-[var(--color-text-secondary)]" />
      <select
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
