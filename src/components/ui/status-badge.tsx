import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status: "active" | "pending" | "lost" | "trial";
};

export function StatusBadge({ className, status, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[var(--badge-height)] items-center rounded-[var(--badge-radius)] border px-[var(--badge-padding-x)] text-xs font-semibold",
        className,
      )}
      data-status={status}
      style={{
        background: "var(--status-background)",
        borderColor: "var(--status-border)",
        color: "var(--status-color)",
      }}
      {...props}
    />
  );
}
