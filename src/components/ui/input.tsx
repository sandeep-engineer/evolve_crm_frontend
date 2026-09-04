import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ className, id, label, hint, ...props }: InputProps) {
  const input = (
    <input
      className={cn(
        "h-[var(--control-height-lg)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm text-[var(--color-text)] shadow-[var(--shadow-xs)] outline-none transition duration-[var(--duration-normal)] ease-[var(--ease-standard)] placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)]",
        className,
      )}
      id={id}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
      <span>{label}</span>
      {input}
      {hint ? (
        <span className="text-xs font-normal text-[var(--color-text-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
