"use client";

import type React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogProps = {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function Dialog({
  children,
  className,
  isOpen,
  onClose,
  title,
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-[var(--space-4)]">
      <div
        className={cn(
          "max-h-[90vh] w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex h-14 items-center justify-between border-b border-[var(--color-divider)] px-[var(--space-5)]">
          <h2 className="text-base font-bold text-[var(--color-text)]">{title}</h2>
          <button
            aria-label="Close dialog"
            className="grid size-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
            onClick={onClose}
            type="button"
          >
            <X className="size-[var(--icon-sm)]" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-3.5rem)] overflow-y-auto p-[var(--space-5)]">
          {children}
        </div>
      </div>
    </div>
  );
}
