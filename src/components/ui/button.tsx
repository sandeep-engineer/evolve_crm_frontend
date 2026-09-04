import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] disabled:bg-[var(--gray-300)] disabled:text-[var(--gray-0)]",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]",
  ghost:
    "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-[var(--control-height-md)] items-center justify-center rounded-[var(--control-radius)] px-[var(--control-padding-x)] text-sm font-semibold transition-colors duration-[var(--duration-normal)] ease-[var(--ease-standard)] disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
