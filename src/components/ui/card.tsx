import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-background)] shadow-[var(--card-shadow)]",
        className,
      )}
      {...props}
    />
  );
}
