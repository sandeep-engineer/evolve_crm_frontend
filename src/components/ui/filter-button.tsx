import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  activeCount?: number;
};

export function FilterButton({
  children,
  icon: Icon,
  activeCount,
  className,
  type = "button",
  ...props
}: FilterButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex h-[var(--control-height-md)] items-center gap-2 rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm font-semibold text-[var(--color-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-surface-hover)]",
        className,
      )}
      type={type}
      {...props}
    >
      {Icon ? <Icon className="size-[var(--icon-sm)] text-[var(--color-text-secondary)]" /> : null}
      <span className="truncate">{children}</span>
      <ChevronDown className="size-[var(--icon-sm)] text-[var(--color-text-secondary)]" />
      {activeCount ? (
        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-text-inverse)]">
          {activeCount}
        </span>
      ) : null}
    </button>
  );
}
